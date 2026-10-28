'use client';
import { useSearchParams } from 'next/navigation';
import DynamicForm from '../../moduleControl/UiControl/DynamicForm';
import { WalletstransfersSchema } from '../WalletstransfersSchema';
import { useEntityFormController } from '../../moduleControl/dataControl/useEntityFormController';
import { mosyGetSchemaTitle } from '../../../MosyUtils/hiveUtils';
import WalletstransfersActions from '../logicControl/actionsRegistry';
import DynamicFormPro from '../../moduleControl/UiControl/Dynamicformpro';

// WalletstransfersProfile — pure shell. It resolves the id, wires up the
// controller, and hands DynamicForm the two strings that make this page
// look like a Company profile: `eyebrow` and `title`. DynamicForm owns
// every pixel of how those get laid out and styled (including the
// profileActions toolbar) — this file has no markup of its own. Point
// the same pattern at a different schema and both the fields AND the
// header/button set change with zero edits here.
export default function WalletstransfersProfile({ id: idProp, syncUrl, onDone, hiddenActions = [], presetValues, schemaOverride }) {
  const searchParams = useSearchParams();
  const schema = schemaOverride || WalletstransfersSchema;
  const id = idProp ?? (syncUrl === false ? null : searchParams.get(`${WalletstransfersSchema.entity}_dataNode`));
  const form = useEntityFormController(schema, WalletstransfersActions, {
    id,
    onDone,
    syncUrl,
    redirectOnDelete: './list',
    initialValues: presetValues,
  });

  return (
    <DynamicFormPro
      controller={form}
      eyebrow={form.isEditing ? `${schema.label}  Profile` : `${schema.label}  Directory`}
      title={form.isEditing ? mosyGetSchemaTitle(schema, form.values, '') : `New ${schema.label}`}
      hiddenActions={hiddenActions}
    />
  );
}


 