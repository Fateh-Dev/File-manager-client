import { FieldPosition } from './field-position.model';

export interface TemplatePayload {
  templateName: string;
  fields: FieldPosition[];
  imageTemplate?: string | File; // Backend might expect base64 or multipart
}
