import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
export const getActiveTemplate = () => {
  return useFormattingTemplateStore.getState().getActiveTemplate()
}
