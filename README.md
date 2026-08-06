# checkmarx-ts

TypeScript SDK for the Checkmarx **SAST** (CxSAST) and **SCA** (CxSCA) REST APIs.

Strongly typed, zero-config when a `~/.Checkmarx/config.ini` is present, and shipped as both
ESM and CommonJS with bundled type declarations.

```bash
npm install checkmarx-ts
```

Requires Node.js 20 or newer.

## Quick start

```ts
import { ProjectsApi, ScansApi } from 'checkmarx-ts/sast';

const projects = new ProjectsApi();
const projectId = await projects.createProjectIfNotExistsByProjectNameAndTeamFullName(
  'my-project',
  '/CxServer',
);

const scans = new ScansApi();
const scan = await scans.createNewScanWithSettings({
  projectId: projectId!,
  presetId: 36,
  zippedSourceFilePath: './source.zip',
  comment: 'triggered from CI',
});

console.log(scan?.id);
```

```ts
import { ScaApi } from 'checkmarx-ts/sca';

const sca = new ScaApi();
const project = await sca.createANewProject('my-project');
const scanId = await sca.getLatestScanIdOfAProject(project.id);
const vulnerabilities = await sca.getVulnerabilitiesOfAScan(scanId!);
```

Everything is also reachable from the root entry point:

```ts
import { sast, sca, CxError } from 'checkmarx-ts';
```

## Configuration

Settings resolve in this order, each layer overriding the one before it:

1. built-in defaults
2. `~/.Checkmarx/config.ini`
3. `~/.Checkmarx/config.json`
4. environment variables (`cxsast_*`, `cxsca_*`, upper or lower case)
5. command line flags (`--cxsast_base_url=...`)

Override the file location with the `checkmarx_config_path` environment variable or the
`--checkmarx_config_path` flag.

```ini
[CxSAST]
base_url = https://sast.example.com
username = ******
password = ******
grant_type = password
scope = sast_rest_api access_control_api
client_id = resource_owner_client
client_secret = 014DF517-39D1-4453-B7B3-9930C563627C

[CxSCA]
access_control_url = https://platform.checkmarx.net
server = https://api-sca.checkmarx.net
account = ***
username = ***
password = ***
```

You can also skip the file entirely and pass configuration in code:

```ts
import { ApiClient, createConfiguration } from 'checkmarx-ts';
import { ProjectsApi } from 'checkmarx-ts/sast';

const client = new ApiClient(
  createConfiguration({
    serverBaseUrl: 'https://sast.example.com',
    tokenUrl: 'https://sast.example.com/cxrestapi/auth/identity/connect/token',
    username: process.env.CX_USER,
    password: process.env.CX_PASSWORD,
    grantType: 'password',
    scope: 'sast_rest_api access_control_api',
    clientId: 'resource_owner_client',
    clientSecret: '014DF517-39D1-4453-B7B3-9930C563627C',
  }),
);

const projects = new ProjectsApi(client);
```

Sharing one `ApiClient` across API classes reuses its access token, connection pool and rate
limiter. Call `client.close()` when you are done to release sockets.

### Options

| Option                                  | Default                | Purpose                                                     |
| --------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `timeout`                               | `60` (SAST: `59`)      | Per-request timeout, in seconds.                            |
| `verify`                                | `true`                 | `false` disables TLS verification; a string is a CA path.   |
| `cert` / `key`                          | –                      | Client certificate, and its key when not bundled in `cert`. |
| `proxy`                                 | –                      | Proxy URL.                                                  |
| `maxRetries`                            | `3`                    | Retries on 401, 5xx and 429.                                |
| `rateLimitCapacity` / `rateLimitPeriod` | `20000` / `300`        | Token-bucket budget, requests per seconds.                  |
| `loggingLevel`                          | `ERROR`                | `DEBUG`…`CRITICAL`, or `SILENT`.                            |
| `logger`                                | built-in stderr logger | Plug in your own logger.                                    |

## What is covered

**SAST** (`checkmarx-ts/sast`) — `ProjectsApi`, `ScansApi`, `GeneralApi`, `EnginesApi`,
`OsaApi`, `DataRetentionApi`, `ConfigurationApi`, `CustomFieldsApi`, `CustomTasksApi`,
`QueriesApi`, `TeamApi`, `AccessControlApi`.

**SCA** (`checkmarx-ts/sca`) — `ScaApi` (projects, scans, risk reports, packages,
vulnerabilities, licenses, management-of-risk, SBOM, file analysis, and the GraphQL
reporting queries), `AccessControlApi`.

**Core** (`checkmarx-ts`) — `ApiClient`, `Configuration`, config resolution, `CxError` and
friends, `RateLimiter`, `TokenBucket`.

Not ported: CxOne, the Portal SOAP API, the OData API, CxReporting, and the CxSAST XML
report parser.

## Notes on the port

This is a port of [checkmarx-python-sdk](https://github.com/checkmarx-ts/checkmarx-python-sdk).
It follows the original method-for-method, with four deliberate adaptations:

- **Everything is async.** The Python SDK is synchronous; every method here returns a `Promise`.
- **DTOs are interfaces at the wire shape.** The Python DTOs rename fields to `snake_case` and
  map them in `from_dict`. Here they are plain interfaces using the JSON field names, so no
  mapping layer sits between you and the API.
- **Long parameter lists became option objects** where the original built a request dataclass
  internally (for example `ScansApi.defineSastScanSettings`, `AccessControl.createNewUser`).
- **`ScansApi.updateScanResultLabelsFields` takes a `useLabelsPath` flag.** The original probes
  the server version over the SOAP API to choose the URL; that module is out of scope, so the
  choice is an explicit parameter defaulting to the CxSAST 9.4+ path.

Two upstream bugs are fixed rather than reproduced: `getSbomSupportedFileFormats` used a
relative URL that could never resolve, and `getPackagesFromInventoryByNameAndVersion` ignored
its `skip` argument.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

## License

GPL-3.0-or-later, inherited from the upstream project this is derived from. See [LICENSE](LICENSE).
