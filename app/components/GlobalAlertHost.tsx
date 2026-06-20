import { useAlertStore } from '../store/alertStore';
import AlertSheet from './AlertSheet';

// Renders the app's styled alert sheet for alerts triggered from non-component
// code (via useAlertStore). Mount once at the app root.
export default function GlobalAlertHost() {
    const alert = useAlertStore((s) => s.alert);
    const dismiss = useAlertStore((s) => s.dismiss);

    return (
        <AlertSheet
            visible={alert != null}
            title={alert?.title}
            message={alert?.message}
            onDismiss={dismiss}
        />
    );
}
