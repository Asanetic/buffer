'use client';
import { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import './Dynamicformpro.css'; // styles travel with this folder (plug-and-play)
import PopoverMenuList from './PopoverMenuList';
import { FIELD_COMPONENTS, TextInput } from './FormFields';
import { FormSection, FieldGroup, formLayoutStyles } from './FormLayout';
import mosyThemeConfigs from '../../../appConfigs/mosyTheme';
import { MosyUIGuard } from '../../UiControl/MosyUiGuard';


// ════════════════════════════════════════════════════════════════
// DynamicFormPro — alternate SKIN for DynamicForm. Same props, same
// `controller` (useEntityFormController), same FormSection/FieldGroup/
// FIELD_COMPONENTS. Nothing about values, validation, submit, actions
// or role filtering changes — only markup + CSS (dfp- namespace).
// Drop-in swap: <DynamicForm .../>  ->  <DynamicFormPro .../>
//
// Layout (UI-only, all optional):
//   - every schema.sections entry renders as its own white card, its
//     label as the card heading
//   - section.placement: 'aside'  -> card goes to the right-hand column
//     (defaults to 1 field per row there unless section.columns is set)
//   - prop `description` -> muted subtitle under the title
//   - Save/Update + Clone stay at the bottom, in their own card footer
// ════════════════════════════════════════════════════════════════

const MAX_VISIBLE_ACTIONS = 4;

function btnClass(variant) {
  const v = variant || 'outline-secondary';
  if (v === 'primary' || v === 'dark') return 'dfp-btn-solid';
  if (v.includes('success')) return 'dfp-btn-success';
  if (v.includes('warning')) return 'dfp-btn-warning';
  if (v.includes('danger')) return 'dfp-btn-danger';
  if (v === 'outline-primary') return 'dfp-btn-accent';
  return '';
}

function ActionButton({ action, disabled, onClick }) {
  return (
    <button
      type="button"
      className={`dfp-btn ${btnClass(action.variant)} ${action.colorClass || ''}`.trim()}
      onClick={onClick || action.onClick}
      disabled={disabled}
    >
      {action.icon && <i className={`fa fa-${action.icon}`}></i>}
      <span>{action.label}</span>
    </button>
  );
}

// Top action row. Desktop: first MAX_VISIBLE_ACTIONS buttons, rest under "More".
// Phones: Back / Delete on the first line; every other action on a second line that fits as many as it can and puts the rest under three dots.
const PRIMARY_KEYS = ['back', 'delete'];

// One-line action strip for phones: shows as many buttons as fit (measured from a hidden twin of each), the rest go under a three-dots button.
function FitLine({ actions, disabled }) {
  const wrapRef = useRef(null);
  const measureRef = useRef(null);
  const moreRef = useRef(null);
  const [fit, setFit] = useState(actions.length);
  const [open, setOpen] = useState(false);
  const sig = actions.map((a) => `${a.key}:${a.label}`).join('|');

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const meas = measureRef.current;
    if (!wrap || !meas) return undefined;
    const GAP = 8;
    const run = () => {
      const avail = wrap.clientWidth;
      const w = [...meas.children].map((el) => el.offsetWidth);
      const moreW = w.pop() || 0;
      const total = w.reduce((a, b) => a + b, 0) + GAP * Math.max(0, w.length - 1);
      if (!avail || total <= avail) return setFit(w.length);
      let used = 0, k = 0;
      for (let i = 0; i < w.length; i += 1) {
        used += w[i] + GAP;
        if (used + moreW <= avail) k = i + 1; else break;
      }
      setFit(k);
    };
    run();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(run) : null;
    ro?.observe(wrap);
    window.addEventListener('resize', run);
    return () => { ro?.disconnect(); window.removeEventListener('resize', run); };
  }, [sig]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const overflow = actions.slice(fit);
  return (
    <div className="dfp-actions-line dfp-fit" ref={wrapRef}>
      {actions.slice(0, fit).map((a) => <ActionButton key={a.key} action={a} disabled={disabled} />)}
      {overflow.length > 0 && (
        <div className="dfp-more-wrap" ref={moreRef}>
          <button type="button" className="dfp-btn dfp-btn-more" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="More actions" title="More">
            <i className="fa fa-ellipsis-h"></i><span>More</span>
          </button>
          {open && (
            <div className="dfp-more-panel sgm-panel">
              <PopoverMenuList items={overflow} disabled={disabled} onPick={(a) => { setOpen(false); a.onClick(); }} />
            </div>
          )}
        </div>
      )}
      <div className="dfp-actions-measure" ref={measureRef} aria-hidden="true">
        {actions.map((a) => <ActionButton key={a.key} action={a} disabled />)}
        <span className="dfp-btn dfp-btn-more"><i className="fa fa-ellipsis-h"></i><span>More</span></span>
      </div>
    </div>
  );
}

function ActionsRow({ actions, disabled }) {
  const moreRef = useRef(null);
  const [phone, setPhone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 767px)');
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!actions.length) return null;

  if (phone) {
    const first = actions.filter((a) => PRIMARY_KEYS.includes(a.key));
    const rest = actions.filter((a) => !PRIMARY_KEYS.includes(a.key));
    return (
      <div className="dfp-actions dfp-actions-stack">
        {first.length > 0 && <div className="dfp-actions-line">{first.map((a) => <ActionButton key={a.key} action={a} disabled={disabled} />)}</div>}
        {rest.length > 0 && <FitLine actions={rest} disabled={disabled} />}
      </div>
    );
  }

  const visible = actions.slice(0, MAX_VISIBLE_ACTIONS);
  const overflow = actions.slice(MAX_VISIBLE_ACTIONS);
  return (
    <div className="dfp-actions">
      {visible.map((a) => <ActionButton key={a.key} action={a} disabled={disabled} />)}
      {overflow.length > 0 && (
        <div className="dfp-more-wrap" ref={moreRef}>
          <button type="button" className="dfp-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <i className="fa fa-ellipsis-h"></i>
            <span>More</span>
          </button>
          {open && (
            <div className="dfp-more-panel sgm-panel">
              <PopoverMenuList items={overflow} disabled={disabled} onPick={(a) => { setOpen(false); a.onClick(); }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DynamicFormPro({ controller, title, eyebrow, description, hiddenActions = [] }) {
  const themeVars = useMemo(
    () => ({
      '--dfp-accent': mosyThemeConfigs.btnBg,
      '--dfp-accent-contrast': mosyThemeConfigs.btnTxt,
      '--dfp-accent-dark': `color-mix(in srgb, ${mosyThemeConfigs.btnBg} 85%, #000000)`,
      '--dfp-accent-soft': `color-mix(in srgb, ${mosyThemeConfigs.btnBg} 12%, transparent)`,
      // kept so any dyn-* CSS still loaded elsewhere resolves too
      '--dyn-primary': mosyThemeConfigs.btnBg,
      '--dyn-primary-contrast': mosyThemeConfigs.btnTxt,
      '--dyn-radius': mosyThemeConfigs.systemBorderRadius,
    }),
    []
  );

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [moreOpen]);

  // FormSection is always asked for its 'card' variant here — this skin
  // supplies the per-section card itself, so the 'sectioned' box would
  // double up. Shallow copy only; fields read schema, never mutate it.
  const cardSchema = useMemo(
    () => (controller.schema ? { ...controller.schema, formStyle: 'card' } : controller.schema),
    [controller.schema]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await controller.submit();
  };

  if (controller.accessDenied) {
    return (
      <MosyUIGuard
        moduleName={controller.schema?.label || controller.schema?.entity}
        reason={`You don't have the "${controller.schema?.moduleRole}" role required to view this.`}
      />
    );
  }

  if (controller.fetching) {
    return (
      <div className="dfp-scope" style={themeVars}>
        <div className="dfp-state">
          <span className="dfp-spinner" aria-hidden="true"></span> Loading...
        </div>
      </div>
    );
  }
  if (controller.fetchError) {
    return (
      <div className="dfp-scope" style={themeVars}>
        <div className="dfp-state dfp-state-error">{controller.fetchError}</div>
      </div>
    );
  }

  const { schema } = controller;
  const resolvedTitle = title || schema?.label;

  // ── actions: identical split to DynamicForm ──
  const profileActions = (controller.actions || [])
    .filter((a) => a.key !== 'save' && a.key !== 'submit')
    .filter((a) => !hiddenActions.includes(a.key));
  const cloneAction = profileActions.find((a) => a.key === 'clone') || null;
  const topActions = profileActions.filter((a) => a.key !== 'clone');
  
  const saveActionDef = schema?.profileActions?.find((a) => a.form && (a.key === 'save' || a.key === 'submit'));
  const submitAction = saveActionDef
    ? {
        key: saveActionDef.key,
        label: controller.submitting ? 'Saving...' : controller.submitLabel || saveActionDef.label,
        variant: saveActionDef.variant || 'primary',
        icon: saveActionDef.icon,
        colorClass: saveActionDef.colorClass,
      }
    : null;

  // ── sections split into main / aside columns ──
  const allSections = schema.sections || [];
  const mainSections = allSections.filter((s) => s.placement !== 'aside');
  const asideSections = allSections.filter((s) => s.placement === 'aside');
  const hasAside = asideSections.length > 0;

  const renderSectionCard = (section, isAside) => (
    <div key={section.key} className={`dfp-card ${isAside ? 'dfp-card-aside' : ''}`}>
      <FormSection
        section={isAside && !section.columns ? { ...section, columns: 1 } : section}
        schema={cardSchema}
        values={controller.values}
        errors={controller.errors}
        setValue={controller.setValue}
        isEditing={controller.isEditing}
        row={controller.record}
      />
    </div>
  );

  const flatFields = !schema.sections && !schema.fieldGroups && (
    <div className="dfp-card">
      <div className="dyn-section">
        <div className="dyn-section-panel px-0">
          <div className="row dyn-grid p-0 m-0 col-md-12">
            {schema.fields
              .filter((f) => !f.system && !FIELD_COMPONENTS[f.type]?.hiddenField)
              .map((f) => {
                if (f.computed && !controller.isEditing) return null;
                const FieldComponent = FIELD_COMPONENTS[f.type] || TextInput;
                const colSpan = f.colSpan || Math.max(1, Math.round(12 / (schema.formColumns || 3)));
                return (
                  <div key={f.key} className={`col-md-${colSpan} dyn-field`}>
                    {!FieldComponent.selfLabeled && (
                      <label className="dyn-label">
                        {f.label}
                        {f.required && <span className="dyn-required"> *</span>}
                      </label>
                    )}
                    <FieldComponent
                      field={f}
                      value={controller.values[f.key]}
                      setValue={controller.setValue}
                      readOnly={f.editable === false}
                      schema={schema}
                      row={controller.record}
                    />
                    {controller.errors[f.key] && <div className="dyn-error">{controller.errors[f.key]}</div>}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  const bottomTray = (cloneAction || submitAction) && (
    <div className="dfp-card dfp-footer-card">
      <div className="dfp-footer">
        {cloneAction && <ActionButton action={cloneAction} disabled={controller.submitting} />}
        {submitAction && (
          <ActionButton action={submitAction} disabled={controller.submitting} onClick={() => controller.submit()} />
        )}
      </div>
    </div>
  );

  return (
    <div className="dfp-scope  p-3 " style={themeVars}>
      {/* ── Page header: title left, actions right ── */}
      <div className="dfp-header">
        <div className="dfp-header-text">
          {eyebrow && <div className="dfp-eyebrow">{eyebrow}</div>}
          {resolvedTitle && <h1 className="dfp-title">{resolvedTitle}</h1>}
          {description && <p className="dfp-description">{description}</p>}
        </div>

        {topActions.length > 0 && <ActionsRow actions={topActions} disabled={controller.submitting} />}
      </div>

      {/* ── Body ── */}
      <form onSubmit={handleSubmit} className={`dfp-layout ${hasAside ? 'has-aside' : ''}`}>
        <div className="dfp-main">
          {mainSections.map((s) => renderSectionCard(s, false))}

          {schema.fieldGroups?.map((group) => (
            <div key={group.key} className="dfp-card">
              <FieldGroup group={group} values={controller.values} setValue={controller.setValue} />
            </div>
          ))}

          {flatFields}
          {bottomTray}
        </div>

        {hasAside && <aside className="dfp-aside">{asideSections.map((s) => renderSectionCard(s, true))}</aside>}
      </form>

      <style jsx global>{formLayoutStyles}</style>
    </div>
  );
}