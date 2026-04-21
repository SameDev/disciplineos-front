# MetaQuest — Frontend

App mobile do **MetaQuest**, sistema pessoal de evolução gamificado para usuários com TDAH.

Construído com Expo (React Native), Expo Router, Zustand, TanStack Query e integração com Spotify.

---

## Contexto do Projeto

Este projeto segue a mesma filosofia do backend — experimento prático baseado nos conceitos de **Fabio Akita** sobre desenvolvimento com IA:

- **[Clean Code para Agentes de IA](https://akitaonrails.com/2026/04/20/clean-code-para-agentes-de-ia/)**
- **[VS Code e o Novo Cartão Perfurado](https://akitaonrails.com/2026/04/11/vs-code-e-o-novo-cartao-perfurado/)**
- **[Do Zero à Pós-Produção em 1 Semana com IA](https://akitaonrails.com/2026/02/20/do-zero-a-pos-producao-em-1-semana-como-usar-ia-em-projetos-de-verdade-bastidores-do-the-m-akita-chronicles/)**

### A Regra

> **Todo o código deste projeto é escrito exclusivamente por IA.**
> O desenvolvedor não digita código manualmente — apenas descreve intenções, valida resultados e toma decisões de produto.

Isso é um **"build to learn"**: entender na prática os limites e capacidades de agentes de IA como par de programação, aplicando princípios do **Extreme Programming (XP)** — ciclos curtos, entrega incremental, feedback imediato.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Expo (React Native) |
| Navegação | Expo Router (file-based) |
| Estado global | Zustand |
| Data fetching | TanStack React Query |
| Animações | Reanimated 4 + Gesture Handler v2 |
| Gráficos | react-native-svg |
| Auth | JWT via REST API |
| Música | Spotify OAuth (PKCE manual) |
| Notificações | expo-notifications |

## Funcionalidades

- **Missões** — CRUD de tarefas/hábitos com dificuldade (easy/medium/hard) e tipo (daily/weekly/one_time)
- **Gamificação** — XP, level, streak visíveis em tempo real com updates otimistas
- **Swipe gestures** — editar/deletar com gesto de arrastar (Reanimated 4)
- **Foco (Pomodoro)** — timer circular SVG com fases configuráveis e notificações em background
- **Spotify** — OAuth PKCE integrado, controle de playback, polling de estado
- **Notas** — editor markdown diário/semanal/mensal com auto-save, sincronizado no backend

## Estrutura

```
app/
  _layout.tsx          # Bootstrap JWT + StatusBar
  login.tsx            # Auth screen
  (tabs)/
    index.tsx          # Missões (lista + swipe + filtros)
    focus.tsx          # Modo foco (Pomodoro + Spotify)
    create.tsx         # Criar/editar tarefa
    notes.tsx          # Notas markdown

components/
  task-card.tsx        # Card com swipe gesture
  ring-timer.tsx       # Timer circular SVG
  spotify-mini.tsx     # Player + OAuth

hooks/
  use-auth.ts          # Login/register/logout
  use-tasks.ts         # CRUD + updates otimistas
  use-pomodoro.ts      # Timer com fases e notificações
  use-spotify.ts       # OAuth PKCE + playback polling

stores/
  auth-store.ts        # Token + user
  spotify-store.ts     # Playback state
  notes-store.ts       # Notas com sync de API

lib/
  api.ts               # HTTP client com JWT
  spotify.ts           # Spotify API client + token refresh
```

## Setup

```bash
cp .env.example .env
# preencha EXPO_PUBLIC_SPOTIFY_CLIENT_ID

npm install
npx expo start
```

### Redirect URI (Spotify Dashboard)

| Ambiente | URI |
|---|---|
| Expo Go (dev) | `exp://localhost:8081/--/spotify-callback` |
| Production build | `focus://spotify-callback` |

## Backend
Repositório: [SameDev/metaquest-api](https://github.com/SameDev/metaquest-api)

---

> *"A IA não substitui o programador. Ela substitui o trabalho repetitivo — o que sobra é o que sempre foi o trabalho real: pensar, decidir, entender."*
