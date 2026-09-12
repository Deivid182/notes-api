.PHONY: dev test lint format docker-up docker-down

dev:          ; pnpm run dev
test:         ; pnpm run test
lint:         ; pnpm run lint && pnpm run typecheck
format:       ; pnpm run format
docker-up:    ; docker compose up --build
docker-down:  ; docker compose down -v