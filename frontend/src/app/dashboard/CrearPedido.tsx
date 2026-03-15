import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Sparkles, 
  Eye, 
  Settings, 
  CheckCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductType } from '../data/mockData';

type WizardStep = 1 | 2 | 3 | 4 | 5;

export default function CrearPedido() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [designSettings, setDesignSettings] = useState({
    color: '#00E5C2',
    size: 'medium',
    material: 'standard',
  });

  const steps = [
    { number: 1, title: 'Tipo de Producto', icon: Settings },
    { number: 2, title: 'Subir Imagen', icon: Upload },
    { number: 3, title: 'Resultados IA', icon: Sparkles },
    { number: 4, title: 'Confirmar', icon: CheckCircle },
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return productType !== null;
      case 2:
        return uploadedImage !== null;
      case 3:
        return selectedVariant !== null;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10 MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        toast.success('Imagen cargada exitosamente');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('¡Pedido creado exitosamente!');
    navigate('/cliente/dashboard');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-accent text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`mt-2 text-xs text-center hidden sm:block ${isActive ? 'font-semibold' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          {currentStep === 1 && <Step1ProductType productType={productType} setProductType={setProductType} />}
          {currentStep === 2 && <Step2Upload uploadedImage={uploadedImage} handleFileUpload={handleFileUpload} />}
          {currentStep === 3 && <Step3AIResults selectedVariant={selectedVariant} setSelectedVariant={setSelectedVariant} uploadedImage={uploadedImage} />}
          {currentStep === 4 && <Step4Editor3D designSettings={designSettings} setDesignSettings={setDesignSettings} />}
          {currentStep === 5 && <Step5Confirm productType={productType} designSettings={designSettings} loading={loading} handleConfirmOrder={handleConfirmOrder} />}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button onClick={handleConfirmOrder} disabled={loading}>
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Confirmar Pedido
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Step 1: Seleccionar tipo de producto
function Step1ProductType({ productType, setProductType }: { 
  productType: ProductType | null; 
  setProductType: (type: ProductType) => void;
}) {
  const products: { type: ProductType; title: string; description: string; imageUrl: string }[] = [
    {
      type: 'bordado',
      title: 'Bordado',
      description: 'Logos y diseños bordados de alta calidad',
      imageUrl: 'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.53.05%20PM%20(1).jpeg',
    },
    {
      type: 'neon-flex',
      title: 'Neon Flex',
      description: 'Letreros luminosos modernos',
      imageUrl: 'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.51.13%20PM.jpeg',
    },
    {
      type: 'acrilico',
      title: 'Acrílico',
      description: 'Placas y letreros acrílicos premium',
      imageUrl: 'https://ppmwqapanrsxnfpfuqol.supabase.co/storage/v1/object/public/borrar%20ahora,%20solo%20fue%20para%20los%20mockups%20de%20sodtware%201/WhatsApp%20Image%202026-02-22%20at%2010.52.24%20PM.jpeg',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Selecciona el tipo de producto</h2>
      <p className="text-muted-foreground mb-6">Elige el tipo de producto que deseas crear</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.type}
            onClick={() => setProductType(product.type)}
            className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
              productType === product.type
                ? 'border-accent shadow-lg scale-105'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <img src={product.imageUrl} alt={product.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold mb-1">{product.title}</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 2: Upload imagen
function Step2Upload({ uploadedImage, handleFileUpload }: { 
  uploadedImage: string | null; 
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Sube tu diseño</h2>
      <p className="text-muted-foreground mb-6">
        Arrastra o selecciona tu archivo (.png, .jpg, .svg max 10 MB)
      </p>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        {uploadedImage ? (
          <div>
            <img src={uploadedImage} alt="Preview" className="max-w-full max-h-64 mx-auto rounded-lg mb-4" />
            <label className="cursor-pointer">
              <span className="text-accent hover:underline">Cambiar imagen</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">Arrastra tu archivo aquí</p>
            <p className="text-sm text-muted-foreground mb-4">o</p>
            <Button type="button">
              <Upload className="w-5 h-5" />
              Seleccionar archivo
            </Button>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

// Step 3: Resultados IA
function Step3AIResults({ selectedVariant, setSelectedVariant, uploadedImage }: { 
  selectedVariant: number | null; 
  setSelectedVariant: (variant: number) => void;
  uploadedImage: string | null;
}) {
  const variants = [1, 2, 3];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Selecciona una variante</h2>
      <p className="text-muted-foreground mb-6">
        La IA ha generado estas variantes de tu diseño
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <div
            key={variant}
            onClick={() => setSelectedVariant(variant)}
            className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
              selectedVariant === variant
                ? 'border-accent shadow-lg scale-105'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              {uploadedImage ? (
                <img src={uploadedImage} alt={`Variante ${variant}`} className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-12 h-12 text-muted-foreground" />
              )}
              {selectedVariant === variant && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-semibold">Variante {variant}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Editor 3D
function Step4Editor3D({ designSettings, setDesignSettings }: { 
  designSettings: any; 
  setDesignSettings: (settings: any) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Editor 3D</h2>
      <p className="text-muted-foreground mb-6">
        Personaliza tu diseño ajustando colores, tamaño y materiales
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 3D Viewer */}
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Vista previa 3D</p>
            <p className="text-sm text-muted-foreground mt-2">Arrastra para rotar</p>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <div>
            <label className="block mb-2">Color Principal</label>
            <div className="flex gap-3">
              {['#00E5C2', '#FF2D95', '#0B213F', '#FFD700'].map((color) => (
                <button
                  key={color}
                  onClick={() => setDesignSettings({ ...designSettings, color })}
                  className={`w-12 h-12 rounded-lg border-2 ${
                    designSettings.color === color ? 'border-accent scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2">Tamaño</label>
            <select
              value={designSettings.size}
              onChange={(e) => setDesignSettings({ ...designSettings, size: e.target.value })}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg"
            >
              <option value="small">Pequeño (20cm)</option>
              <option value="medium">Mediano (40cm)</option>
              <option value="large">Grande (60cm)</option>
              <option value="xlarge">Extra Grande (80cm)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Material</label>
            <select
              value={designSettings.material}
              onChange={(e) => setDesignSettings({ ...designSettings, material: e.target.value })}
              className="w-full px-4 py-2.5 bg-input-background border border-border rounded-lg"
            >
              <option value="standard">Estándar</option>
              <option value="premium">Premium</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 5: Confirmar
function Step5Confirm({ productType, designSettings, loading, handleConfirmOrder }: { 
  productType: ProductType | null;
  designSettings: any; 
  loading: boolean;
  handleConfirmOrder: () => void;
}) {
  const basePrice = 10000;
  const sizeMultiplier = designSettings.size === 'small' ? 1 : designSettings.size === 'medium' ? 1.5 : designSettings.size === 'large' ? 2 : 2.5;
  const materialMultiplier = designSettings.material === 'standard' ? 1 : designSettings.material === 'premium' ? 1.3 : 1.6;
  const totalPrice = Math.round(basePrice * sizeMultiplier * materialMultiplier);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2">Resumen del pedido</h2>
      <p className="text-muted-foreground mb-6">
        Revisa los detalles antes de confirmar
      </p>

      <div className="space-y-4">
        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Tipo de producto</span>
          <span className="font-semibold capitalize">{productType}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Tamaño</span>
          <span className="font-semibold capitalize">{designSettings.size}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Material</span>
          <span className="font-semibold capitalize">{designSettings.material}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-border">
          <span className="text-muted-foreground">Color</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-border"
              style={{ backgroundColor: designSettings.color }}
            />
            <span className="font-semibold">{designSettings.color}</span>
          </div>
        </div>
        <div className="flex justify-between py-4 text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-accent text-2xl">${totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-primary">
          <strong>Tiempo estimado de entrega:</strong> 7-10 días hábiles
        </p>
      </div>
    </div>
  );
}
