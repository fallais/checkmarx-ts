# checkmarx-ts

TypeScript SDK for the Checkmarx **SAST** (CxSAST) and **SCA** (CxSCA) REST APIs.

Strongly typed, explicitly configured, and shipped as both ESM and CommonJS with bundled type
declarations.

```bash
npm install checkmarx-ts
```

Requires Node.js 20 or newer.

## Quick start

```ts
import { ProjectsApi, ScansApi } from 'checkmarx-ts/sast';

const config = {
  baseUrl: 'https://sast.example.com',
  username: process.env.CX_USER,
  password: process.env.CX_PASSWORD,
};

const projects = new ProjectsApi(config);
const projectId = await projects.createProjectIfNotExistsByProjectNameAndTeamFullName(
  'my-project',
  '/CxServer',
);

const scans = new ScansApi(config);
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

const sca = new ScaApi({
  account: 'acme',
  username: process.env.CX_USER!,
  password: process.env.CX_PASSWORD!,
});

const project = await sca.createANewProject('my-project');
const scanId = await sca.getLatestScanIdOfAProject(project.id);
const vulnerabilities = await sca.getVulnerabilitiesOfAScan(scanId!);
```

## SAST OData

CxSAST 9.x also exposes an OData endpoint, reachable under `odata`. Queries are typed and the
helpers follow `@odata.nextLink` paging.

OData sits behind its own scope (`access_control_api sast_api`, client `resource_owner_sast_client`),
so these classes build their token from it. Pass them a config object, not an `ApiClient` shared
with the REST classes — a REST token is rejected by the OData endpoint.

```ts
import { odata } from 'checkmarx-ts/sast';

const scans = new odata.ScansOdataApi(config);
const lastScanId = await scans.getLastFullScanId(projectId);
const loc = await scans.getScanLoc(lastScanId!);

const results = new odata.ResultsOdataApi(config);
const rows = await results.getResultsWithQueryLanguageState(lastScanId!);
```

`ProjectsOdataApi`, `ScansOdataApi` and `ResultsOdataApi` wrap the documented queries; they all
extend `OdataApi`, so anything they miss can be queried directly:

```ts
const api = new odata.OdataApi(config);

const noisy = await api.queryAll<odata.CxOdataScan>('Scans', {
  select: ['Id', 'ProjectName', 'High'],
  filter: `High gt 100 and ScanRequestedOn gt ${odata.odataDate(since)}`,
  orderby: 'High desc',
});
```

Property names are PascalCase, as OData returns them — `$select` and `$filter` match on those.

Everything is also reachable from the root entry point:

```ts
import { sast, sca, CxError } from 'checkmarx-ts';
```

## Configuration

Configuration is always explicit. The SDK never reads a config file, never reads the
environment on its own, and never inspects your process arguments.

Every API class takes either a config object or an `ApiClient`.

### Sharing a client

Passing a config object builds a private `ApiClient` for that instance. To share one access
token, connection pool and rate limiter across several classes, build the client once:

```ts
import { ApiClient } from 'checkmarx-ts';
import { ProjectsApi, ScansApi, sastConfiguration } from 'checkmarx-ts/sast';

const client = new ApiClient(
  sastConfiguration({
    baseUrl: 'https://sast.example.com',
    username: process.env.CX_USER,
    password: process.env.CX_PASSWORD,
  }),
);

const projects = new ProjectsApi(client);
const scans = new ScansApi(client);

// ...

await client.close(); // releases sockets
```

### From environment variables

If you want environment-driven config in CI, call the helper explicitly:

```ts
import { sastConfigurationFromEnv } from 'checkmarx-ts/sast';
import { scaConfigurationFromEnv } from 'checkmarx-ts/sca';

const config = sastConfigurationFromEnv(); // reads CXSAST_*
```

It throws if a required variable is missing rather than falling back to a guess.

| SAST                   | SCA                        |
| ---------------------- | -------------------------- |
| `CXSAST_BASE_URL` \*   | `CXSCA_ACCOUNT` \*         |
| `CXSAST_USERNAME`      | `CXSCA_USERNAME` \*        |
| `CXSAST_PASSWORD`      | `CXSCA_PASSWORD` \*        |
| `CXSAST_GRANT_TYPE`    | `CXSCA_SERVER`             |
| `CXSAST_SCOPE`         | `CXSCA_ACCESS_CONTROL_URL` |
| `CXSAST_CLIENT_ID`     | `CXSCA_SCOPE`              |
| `CXSAST_CLIENT_SECRET` | `CXSCA_TIMEOUT`            |
| `CXSAST_TIMEOUT`       | `CXSCA_VERIFY`             |
| `CXSAST_VERIFY`        | `CXSCA_CERT`               |
| `CXSAST_CERT`          | `CXSCA_KEY`                |
| `CXSAST_KEY`           | `CXSCA_PROXY`              |
| `CXSAST_PROXY`         | `CXSCA_LOGGING_LEVEL`      |
| `CXSAST_LOGGING_LEVEL` |                            |

\* required

### Options

| Option                                  | Default                | Purpose                                                     |
| --------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `timeout`                               | SAST `59`, SCA `60`    | Per-request timeout, in seconds.                            |
| `verify`                                | `true`                 | `false` disables TLS verification; a string is a CA path.   |
| `cert` / `key`                          | –                      | Client certificate, and its key when not bundled in `cert`. |
| `proxy`                                 | –                      | Proxy URL.                                                  |
| `maxRetries`                            | `3`                    | Retries on 401, 5xx and 429.                                |
| `rateLimitCapacity` / `rateLimitPeriod` | `20000` / `300`        | Token-bucket budget, requests per seconds.                  |
| `loggingLevel`                          | `ERROR`                | `DEBUG`…`CRITICAL`, or `SILENT`.                            |
| `logger`                                | built-in stderr logger | Plug in your own logger.                                    |

SAST defaults `grantType` to `password`, `clientId` to `resource_owner_client`, `scope` to
`sast_rest_api access_control_api`, and `clientSecret` to the stock CxSAST secret. SCA defaults
`server` to `https://api-sca.checkmarx.net` and `accessControlUrl` to
`https://platform.checkmarx.net`.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
