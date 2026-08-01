// Deterministic mock data for the DEMAX admin demo.

export type Role = 'home_care' | 'professional'
export type VerifStatus = 'none' | 'pending' | 'approved' | 'rejected'

export type Customer = {
  id: string
  name: string
  username: string
  phone: string
  city: string
  role: Role
  verification: VerifStatus
  managerId: string
  consent: boolean
  lastActive: string
  created: string
}

export type Manager = {
  id: string
  name: string
  email: string
  isAdmin: boolean
  region: string
  capacity: number
  assigned: number
  active: boolean
  lastLogin: string
}

export type Seminar = {
  id: string
  title: string
  type: 'offline' | 'webinar'
  status: 'draft' | 'open' | 'closed' | 'cancelled'
  start: string
  location: string
  capacity: number | null
  taken: number
  attended: number
}

export type Article = {
  id: string
  title: string
  category: string
  language: 'ru' | 'en'
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived'
  version: number
  updated: string
  cited: number
  embedding: 'ready' | 'pending' | '—'
}

export type Msg = { id: string; sender: 'customer' | 'ai' | 'manager' | 'system'; text: string; time: string; intent?: string; confidence?: number; sources?: string[] }

export type Conversation = {
  id: string
  customerId: string
  status: 'active' | 'escalated' | 'closed'
  intent: string
  started: string
  messages: Msg[]
}

export type Escalation = {
  id: string
  conversationId: string
  customerId: string
  reason: 'low_confidence' | 'manager_request' | 'complaint' | 'commercial'
  status: 'open' | 'assigned' | 'resolved' | 'dismissed'
  managerId?: string
  created: string
  confidence: number
}

export type Verification = {
  id: string
  customerId: string
  docType: string
  status: 'pending' | 'approved' | 'rejected'
  submitted: string
  reviewedBy?: string
  reason?: string
}

export type Promotion = {
  id: string
  title: string
  audience: 'all' | 'home_care' | 'professional'
  status: 'draft' | 'active' | 'finished'
  start: string
  queued: number
  sent: number
  delivered: number
  failed: number
}

export type Notice = {
  id: string
  type: string
  channel: 'telegram' | 'in_app'
  recipient: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  scheduled: string
}

export type Audit = {
  id: number
  actor: string
  actorType: 'admin' | 'manager' | 'system'
  action: string
  entity: string
  entityId: string
  time: string
}

export const managers: Manager[] = [
  { id: 'm1', name: 'Ольга Коваль', email: 'olga@demax.example', isAdmin: true, region: 'Kyiv', capacity: 250, assigned: 118, active: true, lastLogin: '2026-08-01T07:42:00Z' },
  { id: 'm2', name: 'Іван Романюк', email: 'ivan@demax.example', isAdmin: false, region: 'Lviv', capacity: 200, assigned: 164, active: true, lastLogin: '2026-08-01T06:15:00Z' },
  { id: 'm3', name: 'Марія Шевчук', email: 'maria@demax.example', isAdmin: false, region: 'Odesa', capacity: 200, assigned: 141, active: true, lastLogin: '2026-07-31T16:03:00Z' },
  { id: 'm4', name: 'Дмитро Бондар', email: 'dmytro@demax.example', isAdmin: false, region: 'Dnipro', capacity: 150, assigned: 97, active: true, lastLogin: '2026-07-30T11:20:00Z' },
  { id: 'm5', name: 'Наталія Гринчук', email: 'nataliia@demax.example', isAdmin: false, region: 'Kharkiv', capacity: 150, assigned: 0, active: false, lastLogin: '2026-06-12T09:00:00Z' },
]

export const customers: Customer[] = [
  { id: 'c1', name: 'Анна Петренко', username: 'anna_p', phone: '+380 67 ••• 4417', city: 'Київ', role: 'professional', verification: 'approved', managerId: 'm1', consent: true, lastActive: '2026-08-01T08:12:00Z', created: '2026-03-14T10:00:00Z' },
  { id: 'c2', name: 'Світлана Мельник', username: 'sv_melnyk', phone: '+380 50 ••• 8821', city: 'Львів', role: 'home_care', verification: 'pending', managerId: 'm2', consent: true, lastActive: '2026-08-01T07:55:00Z', created: '2026-05-02T12:30:00Z' },
  { id: 'c3', name: 'Катерина Іванова', username: 'kat_iv', phone: '+380 63 ••• 1930', city: 'Одеса', role: 'professional', verification: 'approved', managerId: 'm3', consent: false, lastActive: '2026-07-31T19:40:00Z', created: '2026-01-20T09:15:00Z' },
  { id: 'c4', name: 'Юлія Ткаченко', username: 'yulia_tk', phone: '+380 97 ••• 5502', city: 'Дніпро', role: 'home_care', verification: 'none', managerId: 'm4', consent: true, lastActive: '2026-07-31T14:22:00Z', created: '2026-06-18T15:45:00Z' },
  { id: 'c5', name: 'Оксана Лисенко', username: 'oks_lys', phone: '+380 66 ••• 7743', city: 'Київ', role: 'home_care', verification: 'rejected', managerId: 'm1', consent: true, lastActive: '2026-07-30T09:10:00Z', created: '2026-04-25T11:00:00Z' },
  { id: 'c6', name: 'Тетяна Савченко', username: 'tanya_s', phone: '+380 68 ••• 2218', city: 'Львів', role: 'professional', verification: 'approved', managerId: 'm2', consent: true, lastActive: '2026-07-29T17:35:00Z', created: '2026-02-11T08:20:00Z' },
  { id: 'c7', name: 'Ірина Козак', username: 'ira_kozak', phone: '+380 95 ••• 9034', city: 'Одеса', role: 'home_care', verification: 'pending', managerId: 'm3', consent: false, lastActive: '2026-07-28T12:48:00Z', created: '2026-07-01T10:10:00Z' },
  { id: 'c8', name: 'Марина Дорошенко', username: 'mar_dor', phone: '+380 73 ••• 6125', city: 'Харків', role: 'home_care', verification: 'none', managerId: 'm4', consent: true, lastActive: '2026-07-27T20:05:00Z', created: '2026-06-30T13:55:00Z' },
]

export const seminars: Seminar[] = [
  { id: 's1', title: 'Advanced Peeling Protocols', type: 'offline', status: 'open', start: '2026-09-10T11:00:00Z', location: 'Київ, Хрещатик 12', capacity: 40, taken: 31, attended: 0 },
  { id: 's2', title: 'Anti-Age: осінній інтенсив', type: 'webinar', status: 'open', start: '2026-08-21T15:00:00Z', location: 'YouTube Live', capacity: null, taken: 214, attended: 0 },
  { id: 's3', title: 'Базовий догляд Home Care', type: 'webinar', status: 'open', start: '2026-08-12T16:00:00Z', location: 'YouTube Live', capacity: 300, taken: 187, attended: 0 },
  { id: 's4', title: 'Мезотерапія: практикум', type: 'offline', status: 'draft', start: '2026-10-05T10:00:00Z', location: 'Львів, Городоцька 8', capacity: 24, taken: 0, attended: 0 },
  { id: 's5', title: 'Літня школа косметолога', type: 'offline', status: 'closed', start: '2026-07-15T09:00:00Z', location: 'Одеса, Дерибасівська 5', capacity: 60, taken: 60, attended: 52 },
  { id: 's6', title: 'Кислоти в домашньому догляді', type: 'webinar', status: 'closed', start: '2026-06-20T15:00:00Z', location: 'YouTube Live', capacity: null, taken: 342, attended: 289 },
]

export const articles: Article[] = [
  { id: 'a1', title: 'Догляд за сухою шкірою: повний протокол', category: 'skincare', language: 'ru', status: 'published', version: 4, updated: '2026-07-28T10:00:00Z', cited: 412, embedding: 'ready' },
  { id: 'a2', title: 'Кислотні пілінги: показання та протипоказання', category: 'protocols', language: 'ru', status: 'published', version: 2, updated: '2026-07-25T09:30:00Z', cited: 267, embedding: 'ready' },
  { id: 'a3', title: 'Лінійка Home Care: гід по продуктах', category: 'products', language: 'ru', status: 'published', version: 7, updated: '2026-07-30T14:20:00Z', cited: 391, embedding: 'ready' },
  { id: 'a4', title: 'Розацеа: що можна і що не можна', category: 'skincare', language: 'ru', status: 'in_review', version: 3, updated: '2026-07-31T16:45:00Z', cited: 88, embedding: 'pending' },
  { id: 'a5', title: 'SPF: міфи та факти', category: 'skincare', language: 'ru', status: 'published', version: 1, updated: '2026-07-10T08:00:00Z', cited: 154, embedding: 'ready' },
  { id: 'a6', title: 'Професійна лінійка: активні компоненти', category: 'products', language: 'ru', status: 'approved', version: 1, updated: '2026-07-29T11:10:00Z', cited: 0, embedding: '—' },
  { id: 'a7', title: 'Post-procedure care after peeling', category: 'protocols', language: 'en', status: 'draft', version: 1, updated: '2026-07-31T13:00:00Z', cited: 0, embedding: '—' },
  { id: 'a8', title: 'Акне: домашній догляд між процедурами', category: 'skincare', language: 'ru', status: 'published', version: 5, updated: '2026-07-22T15:30:00Z', cited: 203, embedding: 'ready' },
  { id: 'a9', title: 'Умови зберігання професійних засобів', category: 'faq', language: 'ru', status: 'archived', version: 2, updated: '2026-05-15T10:00:00Z', cited: 12, embedding: '—' },
  { id: 'a10', title: 'Програма лояльності: правила', category: 'faq', language: 'ru', status: 'published', version: 3, updated: '2026-07-18T12:00:00Z', cited: 97, embedding: 'ready' },
]

export const conversations: Conversation[] = [
  {
    id: 'v1', customerId: 'c1', status: 'escalated', intent: 'complaint', started: '2026-08-01T07:58:00Z',
    messages: [
      { id: 'g1', sender: 'customer', text: 'Добрый день! Заказала набор для пилинга, а в наборе нет нейтрализатора. Это как понимать?', time: '2026-08-01T07:58:00Z' },
      { id: 'g2', sender: 'ai', text: 'Мне очень жаль, что так вышло. Я передаю ваш вопрос персональному менеджеру — он свяжется с вами в ближайшее время.', time: '2026-08-01T07:58:20Z', intent: 'complaint', confidence: 0.34 },
      { id: 'g3', sender: 'system', text: 'Escalation #E-1041 created → Ольга Коваль', time: '2026-08-01T07:58:21Z' },
    ],
  },
  {
    id: 'v2', customerId: 'c2', status: 'closed', intent: 'product_recommendation', started: '2026-08-01T07:20:00Z',
    messages: [
      { id: 'h1', sender: 'customer', text: 'Какой крем лучше для сухой кожи зимой?', time: '2026-08-01T07:20:00Z' },
      { id: 'h2', sender: 'ai', text: 'Для сухой кожи в холодный сезон рекомендую Hydra Rich Cream: плотная текстура, керамиды и сквалан. Наносите утром за 30 минут до выхода.', time: '2026-08-01T07:20:15Z', intent: 'product_recommendation', confidence: 0.91, sources: ['a1', 'a3'] },
      { id: 'h3', sender: 'customer', text: 'Спасибо!', time: '2026-08-01T07:21:00Z' },
    ],
  },
  {
    id: 'v3', customerId: 'c6', status: 'active', intent: 'protocol_question', started: '2026-08-01T06:40:00Z',
    messages: [
      { id: 'j1', sender: 'customer', text: 'Через сколько дней после срединного пилинга можно наносить ретинол?', time: '2026-08-01T06:40:00Z' },
      { id: 'j2', sender: 'ai', text: 'По протоколу DEMAX ретиноиды возвращают в уход не ранее чем через 14 дней после срединного пилинга, при полном восстановлении барьера.', time: '2026-08-01T06:40:18Z', intent: 'protocol_question', confidence: 0.87, sources: ['a2'] },
    ],
  },
  {
    id: 'v4', customerId: 'c4', status: 'escalated', intent: 'commercial', started: '2026-07-31T15:12:00Z',
    messages: [
      { id: 'k1', sender: 'customer', text: 'Хочу оптовый заказ на салон, есть ли специальные условия?', time: '2026-07-31T15:12:00Z' },
      { id: 'k2', sender: 'ai', text: 'Коммерческие условия обсуждаются с менеджером. Я передала запрос — с вами свяжутся.', time: '2026-07-31T15:12:14Z', intent: 'commercial', confidence: 0.52 },
      { id: 'k3', sender: 'manager', text: 'Добрый день! Это Дмитрий, ваш менеджер. Для салонов действует отдельный прайс — отправлю условия сюда, удобно?', time: '2026-07-31T15:40:00Z' },
    ],
  },
  {
    id: 'v5', customerId: 'c3', status: 'closed', intent: 'seminar_info', started: '2026-07-31T11:05:00Z',
    messages: [
      { id: 'l1', sender: 'customer', text: 'Когда следующий офлайн-семинар по пилингам?', time: '2026-07-31T11:05:00Z' },
      { id: 'l2', sender: 'ai', text: '«Advanced Peeling Protocols» — 10 сентября, Киев. Осталось 9 мест. Зарегистрировать вас?', time: '2026-07-31T11:05:12Z', intent: 'seminar_info', confidence: 0.94, sources: ['a2'] },
      { id: 'l3', sender: 'customer', text: 'Да, давайте', time: '2026-07-31T11:06:00Z' },
      { id: 'l4', sender: 'system', text: 'Registration confirmed: s1', time: '2026-07-31T11:06:02Z' },
    ],
  },
]

export const escalations: Escalation[] = [
  { id: 'E-1041', conversationId: 'v1', customerId: 'c1', reason: 'complaint', status: 'open', created: '2026-08-01T07:58:21Z', confidence: 0.34 },
  { id: 'E-1040', conversationId: 'v4', customerId: 'c4', reason: 'commercial', status: 'assigned', managerId: 'm4', created: '2026-07-31T15:12:14Z', confidence: 0.52 },
  { id: 'E-1039', conversationId: 'v3', customerId: 'c6', reason: 'manager_request', status: 'assigned', managerId: 'm2', created: '2026-07-31T09:30:00Z', confidence: 0.61 },
  { id: 'E-1038', conversationId: 'v2', customerId: 'c2', reason: 'low_confidence', status: 'resolved', managerId: 'm2', created: '2026-07-30T14:00:00Z', confidence: 0.41 },
  { id: 'E-1037', conversationId: 'v5', customerId: 'c3', reason: 'low_confidence', status: 'resolved', managerId: 'm3', created: '2026-07-29T10:20:00Z', confidence: 0.38 },
  { id: 'E-1036', conversationId: 'v2', customerId: 'c5', reason: 'complaint', status: 'dismissed', managerId: 'm1', created: '2026-07-28T16:45:00Z', confidence: 0.29 },
]

export const verifications: Verification[] = [
  { id: 'vr1', customerId: 'c2', docType: 'diploma', status: 'pending', submitted: '2026-07-31T18:20:00Z' },
  { id: 'vr2', customerId: 'c7', docType: 'diploma', status: 'pending', submitted: '2026-07-30T12:10:00Z' },
  { id: 'vr3', customerId: 'c1', docType: 'diploma', status: 'approved', submitted: '2026-03-15T09:00:00Z', reviewedBy: 'm1' },
  { id: 'vr4', customerId: 'c5', docType: 'certificate', status: 'rejected', submitted: '2026-07-25T14:30:00Z', reviewedBy: 'm1', reason: 'Документ нечитабельний' },
  { id: 'vr5', customerId: 'c6', docType: 'diploma', status: 'approved', submitted: '2026-02-12T10:15:00Z', reviewedBy: 'm2' },
]

export const promotions: Promotion[] = [
  { id: 'p1', title: 'Осіння знижка −20% на Home Care', audience: 'home_care', status: 'active', start: '2026-08-01', queued: 842, sent: 840, delivered: 812, failed: 28 },
  { id: 'p2', title: 'Professional Week: подарунок до замовлення', audience: 'professional', status: 'finished', start: '2026-07-14', queued: 316, sent: 316, delivered: 301, failed: 15 },
  { id: 'p3', title: 'Запрошення на літню школу', audience: 'all', status: 'finished', start: '2026-06-28', queued: 1105, sent: 1102, delivered: 1067, failed: 35 },
  { id: 'p4', title: 'New: SPF-лінійка у продажу', audience: 'all', status: 'draft', start: '2026-08-15', queued: 0, sent: 0, delivered: 0, failed: 0 },
]

export const notices: Notice[] = [
  { id: 'n1', type: 'seminar_reminder', channel: 'telegram', recipient: 'Анна Петренко', status: 'delivered', scheduled: '2026-08-01T08:00:00Z' },
  { id: 'n2', type: 'verification_approved', channel: 'telegram', recipient: 'Тетяна Савченко', status: 'delivered', scheduled: '2026-07-31T16:10:00Z' },
  { id: 'n3', type: 'escalation_new', channel: 'in_app', recipient: 'Ольга Коваль', status: 'sent', scheduled: '2026-08-01T07:58:00Z' },
  { id: 'n4', type: 'seminar_reminder', channel: 'telegram', recipient: 'Катерина Іванова', status: 'queued', scheduled: '2026-08-02T08:00:00Z' },
  { id: 'n5', type: 'promo', channel: 'telegram', recipient: 'Юлія Ткаченко', status: 'failed', scheduled: '2026-08-01T09:00:00Z' },
  { id: 'n6', type: 'registration_new', channel: 'in_app', recipient: 'Іван Романюк', status: 'delivered', scheduled: '2026-07-31T11:06:00Z' },
]

export const audit: Audit[] = [
  { id: 9812, actor: 'Ольга Коваль', actorType: 'admin', action: 'kb.article_published', entity: 'knowledge_articles', entityId: 'a3', time: '2026-07-30T14:20:00Z' },
  { id: 9811, actor: 'system', actorType: 'system', action: 'escalation.created', entity: 'escalations', entityId: 'E-1041', time: '2026-08-01T07:58:21Z' },
  { id: 9810, actor: 'Іван Романюк', actorType: 'manager', action: 'verification.approved', entity: 'verification_requests', entityId: 'vr5', time: '2026-07-31T16:09:00Z' },
  { id: 9809, actor: 'Іван Романюк', actorType: 'manager', action: 'verification.document_accessed', entity: 'verification_requests', entityId: 'vr5', time: '2026-07-31T16:05:00Z' },
  { id: 9808, actor: 'Ольга Коваль', actorType: 'admin', action: 'promotion.sent', entity: 'promotions', entityId: 'p1', time: '2026-08-01T06:00:00Z' },
  { id: 9807, actor: 'Марія Шевчук', actorType: 'manager', action: 'escalation.resolved', entity: 'escalations', entityId: 'E-1037', time: '2026-07-29T12:40:00Z' },
  { id: 9806, actor: 'system', actorType: 'system', action: 'customer.registered', entity: 'customers', entityId: 'c8', time: '2026-06-30T13:55:00Z' },
  { id: 9805, actor: 'Ольга Коваль', actorType: 'admin', action: 'manager.created', entity: 'managers', entityId: 'm4', time: '2026-05-20T10:00:00Z' },
  { id: 9804, actor: 'Ольга Коваль', actorType: 'admin', action: 'seminar.created', entity: 'seminars', entityId: 's4', time: '2026-07-28T09:00:00Z' },
  { id: 9803, actor: 'system', actorType: 'system', action: 'kb.reindex_requested', entity: 'knowledge_chunks', entityId: 'a4', time: '2026-07-31T16:46:00Z' },
  { id: 9802, actor: 'Дмитро Бондар', actorType: 'manager', action: 'escalation.assigned', entity: 'escalations', entityId: 'E-1040', time: '2026-07-31T15:20:00Z' },
  { id: 9801, actor: 'Ольга Коваль', actorType: 'admin', action: 'customer.erased', entity: 'customers', entityId: 'c-old-114', time: '2026-07-15T11:30:00Z' },
]

// ---- Chart series (deterministic) ----
export const convPerDay = [
  { d: '25.07', conversations: 96, escalations: 9 },
  { d: '26.07', conversations: 84, escalations: 7 },
  { d: '27.07', conversations: 71, escalations: 5 },
  { d: '28.07', conversations: 118, escalations: 11 },
  { d: '29.07', conversations: 132, escalations: 12 },
  { d: '30.07', conversations: 141, escalations: 10 },
  { d: '31.07', conversations: 156, escalations: 13 },
  { d: '01.08', conversations: 64, escalations: 4 },
]

export const confidenceDist = [
  { bucket: '0–0.2', count: 14 },
  { bucket: '0.2–0.4', count: 36 },
  { bucket: '0.4–0.6', count: 78 },
  { bucket: '0.6–0.8', count: 244 },
  { bucket: '0.8–1.0', count: 517 },
]

export const growth = [
  { m: 'Mar', customers: 118 }, { m: 'Apr', customers: 236 }, { m: 'May', customers: 388 },
  { m: 'Jun', customers: 542 }, { m: 'Jul', customers: 731 }, { m: 'Aug', customers: 768 },
]

export const topQuestions = [
  { q: { ru: 'Подбор ухода по типу кожи', en: 'Skincare routine by skin type' }, n: 214 },
  { q: { ru: 'Постпилинговый уход', en: 'Post-peeling care' }, n: 156 },
  { q: { ru: 'Наличие и цены продуктов', en: 'Product availability & prices' }, n: 133 },
  { q: { ru: 'Даты семинаров', en: 'Seminar dates' }, n: 121 },
  { q: { ru: 'Статус верификации', en: 'Verification status' }, n: 87 },
]

export const notFoundTopics = [
  { q: { ru: 'Совместимость с инъекционными процедурами', en: 'Compatibility with injectables' }, n: 31 },
  { q: { ru: 'Уход при беременности', en: 'Care during pregnancy' }, n: 24 },
  { q: { ru: 'Детская косметика', en: 'Kids cosmetics' }, n: 11 },
]

export const customerById = (id: string) => customers.find((c) => c.id === id)
export const managerById = (id?: string) => managers.find((m) => m.id === id)
export const articleById = (id: string) => articles.find((a) => a.id === id)
export const convById = (id: string) => conversations.find((c) => c.id === id)
