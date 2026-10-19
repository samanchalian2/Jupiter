import { OperationsConsole, type OperationsClient } from '@observability/operations-ui';
import '@observability/operations-ui/styles.css';
import { authenticatedHubFetch } from './JupiterObservability';
import { ObservabilityHelp } from './ObservabilityHelp';
const client: OperationsClient = {
  request: (path, init) => authenticatedHubFetch(`/observability${path}`, init),
};
export function OperationsWorkspace() {
  return <main className="page" dir="rtl"><a className="ui-button secondary" href="/">بازگشت به ژوپیتر</a><ObservabilityHelp/><OperationsConsole client={client} initialSection={window.location.hash==='#alerts'?'alert-inbox':'overview'}/></main>;
}
export function OperationsPanel() { return <><ObservabilityHelp/><OperationsConsole client={client}/></>; }
