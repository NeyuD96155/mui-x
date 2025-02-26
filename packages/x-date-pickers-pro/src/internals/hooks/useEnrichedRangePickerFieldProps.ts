import * as React from 'react';
import Stack, { StackProps } from '@mui/material/Stack';
import Typography, { TypographyProps } from '@mui/material/Typography';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { resolveComponentProps, SlotComponentProps } from '@mui/base/utils';
import useEventCallback from '@mui/utils/useEventCallback';
import useForkRef from '@mui/utils/useForkRef';
import {
  BaseSingleInputFieldProps,
  FieldSelectedSections,
  FieldRef,
  PickerValidDate,
} from '@mui/x-date-pickers/models';
import { UseClearableFieldSlots, UseClearableFieldSlotProps } from '@mui/x-date-pickers/hooks';
import { PickersInputLocaleText } from '@mui/x-date-pickers/locales';
import {
  BaseFieldProps,
  onSpaceOrEnter,
  useLocaleText,
  UsePickerResponse,
  WrapperVariant,
  UsePickerProps,
  getActiveElement,
  DateOrTimeViewWithMeridiem,
} from '@mui/x-date-pickers/internals';
import {
  BaseMultiInputFieldProps,
  MultiInputFieldSlotRootProps,
  MultiInputFieldSlotTextFieldProps,
  RangeFieldSection,
  UseDateRangeFieldProps,
  FieldType,
} from '../models';
import { DateRange, RangePosition } from '../../models';
import { UseRangePositionResponse } from './useRangePosition';

export interface RangePickerFieldSlots extends UseClearableFieldSlots {
  field: React.ElementType;
  /**
   * Element rendered at the root.
   * Ignored if the field has only one input.
   */
  fieldRoot?: React.ElementType<StackProps>;
  /**
   * Element rendered between the two inputs.
   * Ignored if the field has only one input.
   */
  fieldSeparator?: React.ElementType<TypographyProps>;
  /**
   * Form control with an input to render a date or time inside the default field.
   * It is rendered twice: once for the start element and once for the end element.
   * Receives the same props as `@mui/material/TextField`.
   * @default TextField from '@mui/material'
   */
  textField?: React.ElementType<TextFieldProps>;
}

export interface RangePickerFieldSlotProps<TDate extends PickerValidDate>
  extends UseClearableFieldSlotProps {
  field?: SlotComponentProps<
    React.ElementType<
      BaseMultiInputFieldProps<DateRange<TDate>, TDate, RangeFieldSection, unknown>
    >,
    {},
    UsePickerProps<DateRange<TDate>, TDate, any, RangeFieldSection, any, any, any>
  >;
  fieldRoot?: SlotComponentProps<typeof Stack, {}, Record<string, any>>;
  fieldSeparator?: SlotComponentProps<typeof Typography, {}, Record<string, any>>;

  textField?: SlotComponentProps<
    typeof TextField,
    {},
    UseDateRangeFieldProps<TDate> & { position?: RangePosition }
  >;
}

export interface UseEnrichedRangePickerFieldPropsParams<
  TDate extends PickerValidDate,
  TView extends DateOrTimeViewWithMeridiem,
  TError,
  FieldProps extends BaseFieldProps<
    DateRange<TDate>,
    TDate,
    RangeFieldSection,
    TError
  > = BaseFieldProps<DateRange<TDate>, TDate, RangeFieldSection, TError>,
> extends Pick<
      UsePickerResponse<DateRange<TDate>, TView, RangeFieldSection, any>,
      'open' | 'actions'
    >,
    UseRangePositionResponse {
  wrapperVariant: WrapperVariant;
  fieldType: FieldType;
  readOnly?: boolean;
  labelId?: string;
  disableOpenPicker?: boolean;
  onBlur?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
  label?: React.ReactNode;
  localeText: PickersInputLocaleText<TDate> | undefined;
  pickerSlotProps: RangePickerFieldSlotProps<TDate> | undefined;
  pickerSlots: RangePickerFieldSlots | undefined;
  fieldProps: FieldProps;
  anchorRef?: React.Ref<HTMLDivElement>;
  currentView?: TView | null;
  initialView?: TView;
  onViewChange?: (view: TView) => void;
}

const useMultiInputFieldSlotProps = <
  TDate extends PickerValidDate,
  TView extends DateOrTimeViewWithMeridiem,
  TError,
>({
  wrapperVariant,
  open,
  actions,
  readOnly,
  labelId,
  disableOpenPicker,
  onBlur,
  rangePosition,
  onRangePositionChange,
  localeText: inLocaleText,
  pickerSlotProps,
  pickerSlots,
  fieldProps,
  anchorRef,
  currentView,
  initialView,
  onViewChange,
}: UseEnrichedRangePickerFieldPropsParams<
  TDate,
  TView,
  TError,
  BaseMultiInputFieldProps<DateRange<TDate>, TDate, RangeFieldSection, TError>
>) => {
  type ReturnType = BaseMultiInputFieldProps<DateRange<TDate>, TDate, RangeFieldSection, TError>;

  const localeText = useLocaleText<TDate>();
  const startRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);
  const startFieldRef = React.useRef<FieldRef<RangeFieldSection>>(null);
  const endFieldRef = React.useRef<FieldRef<RangeFieldSection>>(null);
  const handleStartFieldRef = useForkRef(fieldProps.unstableStartFieldRef, startFieldRef);
  const handleEndFieldRef = useForkRef(fieldProps.unstableFieldRef, endFieldRef);
  const previousRangePosition = React.useRef<RangePosition>(rangePosition);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const currentRef = rangePosition === 'start' ? startRef : endRef;
    currentRef.current?.focus();
    const currentFieldRef = rangePosition === 'start' ? startFieldRef : endFieldRef;
    if (!currentFieldRef.current || !currentView) {
      // could happen when the user is switching between the inputs
      previousRangePosition.current = rangePosition;
      return;
    }
    // bring back focus to the field
    currentFieldRef.current.setSelectedSections(
      // use the current view or `0` when the range position has just been swapped
      previousRangePosition.current === rangePosition ? currentView : 0,
    );
    previousRangePosition.current = rangePosition;
  }, [rangePosition, open, currentView]);

  const openRangeStartSelection = (
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
    onRangePositionChange('start');
    if (!readOnly && !disableOpenPicker) {
      actions.onOpen();
    }
  };

  const openRangeEndSelection = (
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
    onRangePositionChange('end');
    if (!readOnly && !disableOpenPicker) {
      actions.onOpen();
    }
  };

  const handleFocusStart = () => {
    if (open) {
      onRangePositionChange('start');
      if (previousRangePosition.current !== 'start' && initialView) {
        onViewChange?.(initialView);
      }
    }
  };

  const handleFocusEnd = () => {
    if (open) {
      onRangePositionChange('end');
      if (previousRangePosition.current !== 'end' && initialView) {
        onViewChange?.(initialView);
      }
    }
  };

  const slots: ReturnType['slots'] = {
    textField: pickerSlots?.textField,
    root: pickerSlots?.fieldRoot,
    separator: pickerSlots?.fieldSeparator,
    ...fieldProps.slots,
  };

  const slotProps: ReturnType['slotProps'] & {
    separator?: any;
  } = {
    ...fieldProps.slotProps,
    textField: (ownerState) => {
      const resolvedComponentProps = resolveComponentProps(pickerSlotProps?.textField, ownerState);
      let inputProps: MultiInputFieldSlotTextFieldProps;
      let InputProps: MultiInputFieldSlotTextFieldProps['InputProps'];
      if (ownerState.position === 'start') {
        inputProps = {
          inputRef: startRef,
          label: inLocaleText?.start ?? localeText.start,
          onKeyDown: onSpaceOrEnter(openRangeStartSelection),
          onFocus: handleFocusStart,
          focused: open ? rangePosition === 'start' : undefined,
          // registering `onClick` listener on the root element as well to correctly handle cases where user is clicking on `label`
          // which has `pointer-events: none` and due to DOM structure the `input` does not catch the click event
          ...(!readOnly && !fieldProps.disabled && { onClick: openRangeStartSelection }),
          ...(wrapperVariant === 'mobile' && { readOnly: true }),
        };
        if (anchorRef) {
          InputProps = {
            ...resolvedComponentProps?.InputProps,
            ref: anchorRef,
          };
        }
      } else {
        inputProps = {
          inputRef: endRef,
          label: inLocaleText?.end ?? localeText.end,
          onKeyDown: onSpaceOrEnter(openRangeEndSelection),
          onFocus: handleFocusEnd,
          focused: open ? rangePosition === 'end' : undefined,
          // registering `onClick` listener on the root element as well to correctly handle cases where user is clicking on `label`
          // which has `pointer-events: none` and due to DOM structure the `input` does not catch the click event
          ...(!readOnly && !fieldProps.disabled && { onClick: openRangeEndSelection }),
          ...(wrapperVariant === 'mobile' && { readOnly: true }),
        };
        InputProps = resolvedComponentProps?.InputProps;
      }

      return {
        ...(labelId != null && { id: `${labelId}-${ownerState.position!}` }),
        ...inputProps,
        ...resolveComponentProps(pickerSlotProps?.textField, ownerState),
        InputProps,
      };
    },
    root: (ownerState) => {
      const rootProps: MultiInputFieldSlotRootProps = {
        onBlur,
      };

      return {
        ...rootProps,
        ...resolveComponentProps(pickerSlotProps?.fieldRoot, ownerState),
      };
    },
    separator: pickerSlotProps?.fieldSeparator,
  };

  /* TODO: remove this when a clearable behavior for multiple input range fields is implemented */
  const { clearable, onClear, ...restFieldProps } = fieldProps;

  const enrichedFieldProps: ReturnType = {
    ...restFieldProps,
    slots,
    slotProps,
    unstableStartFieldRef: handleStartFieldRef,
    unstableEndFieldRef: handleEndFieldRef,
  };

  return enrichedFieldProps;
};

const useSingleInputFieldSlotProps = <
  TDate extends PickerValidDate,
  TView extends DateOrTimeViewWithMeridiem,
  TError,
>({
  wrapperVariant,
  open,
  actions,
  readOnly,
  inputRef: inInputRef,
  labelId,
  disableOpenPicker,
  label,
  onBlur,
  rangePosition,
  onRangePositionChange,
  singleInputFieldRef,
  pickerSlots,
  pickerSlotProps,
  fieldProps,
  anchorRef,
  currentView,
}: UseEnrichedRangePickerFieldPropsParams<
  TDate,
  TView,
  TError,
  BaseSingleInputFieldProps<DateRange<TDate>, TDate, RangeFieldSection, TError>
>) => {
  type ReturnType = BaseSingleInputFieldProps<DateRange<TDate>, TDate, RangeFieldSection, TError>;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleInputRef = useForkRef(inInputRef, inputRef);

  const handleFieldRef = useForkRef(fieldProps.unstableFieldRef, singleInputFieldRef);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
    if (!singleInputFieldRef.current || !currentView) {
      return;
    }
    const sections = singleInputFieldRef.current.getSections().map((section) => section.type);
    // bring back focus to the field with the current view section selected
    singleInputFieldRef.current.setSelectedSections(
      rangePosition === 'start' ? sections.indexOf(currentView) : sections.lastIndexOf(currentView),
    );
  }, [rangePosition, open, currentView, singleInputFieldRef]);

  const updateRangePosition = () => {
    if (!singleInputFieldRef.current || inputRef.current !== getActiveElement(document)) {
      return;
    }

    const sections = singleInputFieldRef.current.getSections();
    const activeSectionIndex = singleInputFieldRef.current?.getActiveSectionIndex();
    const domRangePosition =
      activeSectionIndex == null || activeSectionIndex < sections.length / 2 ? 'start' : 'end';

    if (domRangePosition != null && domRangePosition !== rangePosition) {
      onRangePositionChange(domRangePosition);
    }
  };

  const handleSelectedSectionsChange = useEventCallback(
    (selectedSections: FieldSelectedSections) => {
      setTimeout(updateRangePosition);
      fieldProps.onSelectedSectionsChange?.(selectedSections);
    },
  );

  const openPicker = (event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();

    if (!readOnly && !disableOpenPicker) {
      actions.onOpen();
    }
  };

  const slots: ReturnType['slots'] = {
    ...fieldProps.slots,
    textField: pickerSlots?.textField,
    clearButton: pickerSlots?.clearButton,
    clearIcon: pickerSlots?.clearIcon,
  };

  const slotProps: ReturnType['slotProps'] = {
    ...fieldProps.slotProps,
    textField: pickerSlotProps?.textField,
    clearButton: pickerSlots?.clearButton,
    clearIcon: pickerSlots?.clearIcon,
  };

  const enrichedFieldProps: ReturnType = {
    ...fieldProps,
    slots,
    slotProps,
    label,
    unstableFieldRef: handleFieldRef,
    inputRef: handleInputRef,
    onKeyDown: onSpaceOrEnter(openPicker, fieldProps.onKeyDown),
    onSelectedSectionsChange: handleSelectedSectionsChange,
    onBlur,
    InputProps: {
      ref: anchorRef,
      ...fieldProps?.InputProps,
    },
    focused: open,
    ...(labelId != null && { id: labelId }),
    ...(wrapperVariant === 'mobile' && { readOnly: true }),
    // registering `onClick` listener on the root element as well to correctly handle cases where user is clicking on `label`
    // which has `pointer-events: none` and due to DOM structure the `input` does not catch the click event
    ...(!readOnly && !fieldProps.disabled && { onClick: openPicker }),
  };

  return enrichedFieldProps;
};

export const useEnrichedRangePickerFieldProps = <
  TDate extends PickerValidDate,
  TView extends DateOrTimeViewWithMeridiem,
  TError,
>(
  params: UseEnrichedRangePickerFieldPropsParams<TDate, TView, TError>,
) => {
  /* eslint-disable react-hooks/rules-of-hooks */
  if (process.env.NODE_ENV !== 'production') {
    const fieldTypeRef = React.useRef(params.fieldType);
    if (params.fieldType !== fieldTypeRef.current) {
      console.error(
        'Should not switch between a multi input field and a single input field on a range picker.',
      );
    }
  }

  if (params.fieldType === 'multi-input') {
    return useMultiInputFieldSlotProps(params);
  }

  return useSingleInputFieldSlotProps(params);
  /* eslint-enable react-hooks/rules-of-hooks */
};
