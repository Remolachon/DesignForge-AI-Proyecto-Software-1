export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type ProductType = 'bordado' | 'neon-flex' | 'acrilico';

export interface DesignSettings {
  color: string;
  size: 'small' | 'medium' | 'large' | 'xlarge';
  material: 'standard' | 'premium' | 'deluxe';
}