import { FieldPosition } from './field-position.model';

export interface TemplatePayload {
  templateName: string;
  fields: FieldPosition[];
  imageTemplate: string; // GUID of the stored image in the database
}
