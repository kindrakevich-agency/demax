FROM python:3.12-slim
WORKDIR /srv
ENV PYTHONUNBUFFERED=1 \
    FASTEMBED_CACHE_PATH=/models
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY data ./data
EXPOSE 8100
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
