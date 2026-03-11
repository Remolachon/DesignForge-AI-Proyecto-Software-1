import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Search, Filter, Star } from 'lucide-react';
import { mockMarketplaceProducts, ProductType, getProductTypeLabel } from '../data/mockData';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all');
  const navigate = useNavigate();

  const filteredProducts = mockMarketplaceProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || product.productType === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleBuyProduct = (productId: string) => {
    toast.success('Producto agregado al carrito');
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-primary mb-2">Marketplace</h1>
          <p className="text-muted-foreground">
            Explora y compra productos listos para entrega
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'primary' : 'secondary'}
                onClick={() => setFilterType('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterType === 'bordado' ? 'primary' : 'secondary'}
                onClick={() => setFilterType('bordado')}
              >
                Bordado
              </Button>
              <Button
                variant={filterType === 'neon-flex' ? 'primary' : 'secondary'}
                onClick={() => setFilterType('neon-flex')}
              >
                Neon
              </Button>
              <Button
                variant={filterType === 'acrilico' ? 'primary' : 'secondary'}
                onClick={() => setFilterType('acrilico')}
              >
                Acrílico
              </Button>
            </div>
          </div>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} hover className="flex flex-col">
              <div className="aspect-square overflow-hidden rounded-lg mb-4 relative">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">Agotado</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="mb-2">
                  <Badge variant="default">{getProductTypeLabel(product.productType)}</Badge>
                </div>

                <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold">{product.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews} reseñas)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ${product.price.toLocaleString()}
                  </span>
                  <Button
                    onClick={() => handleBuyProduct(product.id)}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'Comprar' : 'Agotado'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No se encontraron productos</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
