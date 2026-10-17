import { OperationsConsole, type OperationsClient } from '@observability/operations-ui';
import '@observability/operations-ui/styles.css';
import { authenticatedHubFetch } from './JupiterObservability';
const client: OperationsClient = {
  request: (path, init) => authenticatedHubFetch(`/observability${path}`, init),
};
export function OperationsWorkspace() {
  return <main className="page" dir="rtl"><a className="ui-button secondary" href="/">بازگشت به ژوپیتر</a><OperationsConsole client={client}/></main>;
}
export function OperationsPanel() { return <OperationsConsole client={client}/>; }
