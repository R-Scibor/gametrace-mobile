import AlertSheet from './AlertSheet';
import ConflictSheet from './ConflictSheet';
import type { SaveError } from '../utils/conflict';
import type { ConflictingSession } from '../types/api';

export default function SaveErrorSheet({
    error,
    onDismiss,
    onEdit,
}: {
    error: SaveError | null;
    onDismiss: () => void;
    onEdit: (session: ConflictingSession) => void;
}) {
    if (error == null) return null;
    if (error.kind === 'conflict') {
        return <ConflictSheet conflict={error.conflict} onDismiss={onDismiss} onEdit={onEdit} />;
    }
    return <AlertSheet visible message={error.message} onDismiss={onDismiss} />;
}
