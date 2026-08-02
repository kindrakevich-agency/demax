"""Оцінка якості пошуку й відповідей на фіксованому наборі питань.

Дві частини:

  retrieval — чи знаходить пошук релевантні фрагменти (P@5, MRR).
              Релевантність розмічає LLM-суддя, який НЕ знає, звідки фрагмент.
  behaviour — чи поводиться асистент як домовлено: відповідає там, де має
              відповідати, ескалює комерційне й скарги, не вигадує там,
              де в базі нічого немає.

Запуск (з теки demax-rag, змінні з .env мають бути в оточенні):

    python -m eval.run                  # обидві частини
    python -m eval.run --only retrieval
    python -m eval.run --baseline eval/baseline.json   # порівняти з попереднім
    python -m eval.run --save eval/baseline.json       # зберегти як еталон

Суддя окремий від моделі відповіді, щоб не оцінювати себе.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import sys
import time

import httpx

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app import rag  # noqa: E402

HERE = pathlib.Path(__file__).parent
JUDGE_MODEL = os.environ.get("EVAL_JUDGE_MODEL", "gpt-4o")
TOP_K = 5

JUDGE_PROMPT = """Ти оцінюєш якість пошуку в базі знань українського бренду
професійної косметики DEMAX.

Питання користувача: «{q}»

Нижче фрагменти, знайдені пошуком. Для кожного визнач, чи допомагає він
відповісти саме на це питання:
1 — фрагмент містить інформацію, яка прямо відповідає на питання;
0 — фрагмент про бренд загалом, про іншу категорію товарів або лише
    загальні слова без відповіді.

Будь суворим: загальна сторінка «Професійна косметика для косметологів»
не є відповіддю на питання про конкретну категорію засобів.

Фрагменти:
{items}

Поверни ТІЛЬКИ JSON-масив чисел 0/1 у тому ж порядку, без пояснень."""


def _judge(question: str, items: list[dict]) -> list[int]:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise SystemExit("потрібен OPENAI_API_KEY для судді")
    body = "\n\n".join(f"[{i + 1}] {it['title']}\n{it['snippet']}" for i, it in enumerate(items))
    for attempt in range(4):
        try:
            r = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json={
                    "model": JUDGE_MODEL,
                    "messages": [{"role": "user", "content": JUDGE_PROMPT.format(q=question, items=body)}],
                    "max_completion_tokens": 2048,
                },
                timeout=180,
            )
            r.raise_for_status()
            txt = r.json()["choices"][0]["message"]["content"]
            got = json.loads(txt[txt.find("[") : txt.rfind("]") + 1])
            if len(got) == len(items):
                return [int(x) for x in got]
        except Exception as e:  # noqa: BLE001
            print(f"    суддя, спроба {attempt + 1}: {str(e)[:90]}", file=sys.stderr)
            time.sleep(3)
    return [0] * len(items)


def eval_retrieval(cases: list[dict]) -> dict:
    per_case, p_sum, mrr_sum, covered = [], 0.0, 0.0, 0
    scored = [c for c in cases if c["expect"] == "answer"]
    for c in scored:
        hits_raw = rag.retrieve(c["question"])[:TOP_K]
        items = [
            {"title": h["title"], "snippet": h["content"][:220].replace("\n", " ")}
            for h in hits_raw
        ]
        labels = _judge(c["question"], items) if items else []
        first = next((i + 1 for i, v in enumerate(labels) if v), None)
        p5 = sum(labels) / TOP_K if labels else 0.0
        mrr = 1 / first if first else 0.0
        p_sum += p5
        mrr_sum += mrr
        covered += 1 if first else 0
        per_case.append({"id": c["id"], "p_at_5": round(p5, 3), "mrr": round(mrr, 3),
                         "titles": [h["title"] for h in hits_raw]})
        print(f"  {c['id']:<20} P@5={p5:.1f}  MRR={mrr:.2f}")
    n = len(scored) or 1
    return {"p_at_5": round(p_sum / n, 3), "mrr": round(mrr_sum / n, 3),
            "covered": f"{covered}/{len(scored)}", "cases": per_case}


NO_ANSWER_MARKERS = ("немає інформації", "не маю інформації", "нет информации",
                     "no information", "не знайшов", "не можу знайти")


def eval_behaviour(cases: list[dict]) -> dict:
    ok, per_case = 0, []
    for c in cases:
        res = rag.answer(c["question"], [], c["lang"])
        reply = (res.get("reply") or "").lower()
        if c["expect"] == "escalate":
            passed = bool(res["escalated"])
        elif c["expect"] == "no-answer":
            passed = bool(res["escalated"]) or any(m in reply for m in NO_ANSWER_MARKERS)
        else:
            passed = not res["escalated"] and len(reply) > 40
        ok += passed
        per_case.append({"id": c["id"], "expect": c["expect"], "escalated": res["escalated"],
                         "passed": passed, "reply": (res.get("reply") or "")[:160]})
        print(f"  {c['id']:<20} {'OK ' if passed else 'FAIL'}  очікували={c['expect']}")
    return {"passed": ok, "total": len(cases), "cases": per_case}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", choices=["retrieval", "behaviour"])
    ap.add_argument("--baseline")
    ap.add_argument("--save")
    args = ap.parse_args()

    cases = json.loads((HERE / "questions.json").read_text(encoding="utf-8"))
    report: dict = {"model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                    "judge": JUDGE_MODEL, "questions": len(cases)}

    if args.only != "behaviour":
        print("\n── Пошук ──")
        report["retrieval"] = eval_retrieval(cases)
        r = report["retrieval"]
        print(f"  ПІДСУМОК  P@5={r['p_at_5']}  MRR={r['mrr']}  із влучанням {r['covered']}")

    if args.only != "retrieval":
        print("\n── Поведінка ──")
        report["behaviour"] = eval_behaviour(cases)
        b = report["behaviour"]
        print(f"  ПІДСУМОК  {b['passed']}/{b['total']}")

    if args.baseline:
        base = json.loads(pathlib.Path(args.baseline).read_text(encoding="utf-8"))
        print("\n── Порівняння з еталоном ──")
        if "retrieval" in report and "retrieval" in base:
            for k in ("p_at_5", "mrr"):
                was, now = base["retrieval"][k], report["retrieval"][k]
                sign = "↑" if now > was else ("↓" if now < was else "=")
                print(f"  {k:<8} {was} → {now}  {sign}")
        if "behaviour" in report and "behaviour" in base:
            print(f"  поведінка {base['behaviour']['passed']} → {report['behaviour']['passed']}"
                  f" з {report['behaviour']['total']}")

    if args.save:
        pathlib.Path(args.save).write_text(
            json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nзбережено: {args.save}")


if __name__ == "__main__":
    main()
