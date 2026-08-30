# hackathon.ecommatools.co
#
# The front page is the LIVE instrument running its demo story, rather than a
# static picture of one. Everything Tellurion claims about itself is a claim
# about motion — bodies appearing when work starts, a moon washing when a judge
# passes it, a promise going red when one is broken — and a screenshot can carry
# none of that. So the page a visitor lands on is the instrument itself, with a
# story feeding it the inputs a real session would feed.
#
# The story writes the plan and sign-off files inside the container and the
# ordinary watchers pick them up, so a visitor is watching the real mechanism.
#
# --public is what makes that safe to expose. It refuses every mutating route
# outright, for every method, key or no key, and keeps the doors that could
# enumerate other work on the machine shut; only the read doors serving this
# invented fixture are open. That is a stricter position than the default "a
# write needs the key", not a looser one.

# Build stage — compiles the VS Code extension (kept: `npm run compile` is the
# typecheck, and a Dockerfile that stops running it stops catching type errors).
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run compile

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# The instrument has ZERO dependencies and needs Node and nothing else, which is
# why there is no npm install in this stage and no node_modules in the image.
COPY --from=builder /app/packages/tellurion ./packages/tellurion
COPY --from=builder /app/media ./media
COPY --from=builder /app/out ./out
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# --story is fenced: it refuses any directory without a .tellurion/DEMO-PROJECT
# marker, so this can only ever rewrite the demo fixture that ships beside it.
WORKDIR /app/packages/tellurion
CMD ["node", "server.mjs", \
     "--project", "demo/project", \
     "--world", "demo/data/world-static.json", \
     "--story", "demo/story.mjs", \
     "--name", "Lantern", \
     "--port", "3000", \
     "--host", "0.0.0.0", \
     "--public"]
