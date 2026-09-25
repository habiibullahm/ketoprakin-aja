import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test from "node:test"

const repositoryRoot = resolve(__dirname, "../../../")
const composePath = resolve(repositoryRoot, "docker-compose.yml")
const dockerCompose = spawnSync("docker", ["compose", "version"], { encoding: "utf8" })
const canRunDockerCompose = !dockerCompose.error && dockerCompose.status === 0

function runCompose(envFileContent: string) {
  const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "ketoprakin-compose-test-"))
  const envFile = resolve(temporaryDirectory, ".env")
  writeFileSync(envFile, envFileContent)

  try {
    return spawnSync("docker", ["compose", "--env-file", envFile, "-f", composePath, "config", "--format", "json"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    })
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

test("Compose requires explicit JWT and initial merchant secrets", { skip: !canRunDockerCompose }, () => {
  const result = runCompose("")

  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /MERCHANT_INITIAL_PASSWORD|JWT_SECRET/)
})

test("Compose passes configured secrets to their services", { skip: !canRunDockerCompose }, () => {
  const jwtSecret = "a".repeat(32)
  const merchantPassword = "b".repeat(12)
  const result = runCompose(`JWT_SECRET=${jwtSecret}\nMERCHANT_INITIAL_PASSWORD=${merchantPassword}\n`)

  assert.equal(result.status, 0, result.stderr)
  const config = JSON.parse(result.stdout) as {
    services: {
      backend: { environment: { JWT_SECRET: string } }
      "db-init": { environment: { MERCHANT_INITIAL_PASSWORD: string } }
    }
  }
  assert.equal(config.services.backend.environment.JWT_SECRET, jwtSecret)
  assert.equal(config.services["db-init"].environment.MERCHANT_INITIAL_PASSWORD, merchantPassword)
})