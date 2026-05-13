import { MediaUploadItem } from '@/components/marketplace/types/marketplace.types';
import { FileAsset } from '@/types/product';
import { funcionarioMarketplaceService } from '@/services/funcionario-marketplace.service';

export const uploadProductMedia = async (
    companyId: number,
    productId: number,
    mediaItems: MediaUploadItem[],
    userId?: number
): Promise<FileAsset[] | null> => {
    try {
        const fileAssets: FileAsset[] = [];

        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i];
            
            // Skip already uploaded items
            if (!item.file) continue;

            // Upload via backend to safely bypass RLS and insert to database
            const dbData = await funcionarioMarketplaceService.uploadProductMedia(
                productId,
                companyId,
                item.media_kind,
                item.media_role,
                i,
                item.file
            );

            fileAssets.push(dbData);
        }

        return fileAssets;
    } catch (error) {
        console.error('uploadProductMedia failed:', error);
        throw error;
    }
};
