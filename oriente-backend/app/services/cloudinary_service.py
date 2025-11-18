"""
Serviço de upload de arquivos usando Cloudinary
Usado em produção para armazenamento persistente de anexos
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.core.config import settings
from typing import Optional, Dict
import os


class CloudinaryService:
    """
    Serviço para gerenciar uploads de arquivos no Cloudinary
    """

    def __init__(self):
        """Inicializa configuração do Cloudinary"""
        if settings.use_cloudinary:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )

    def upload_file(
        self,
        file_path: str,
        folder: str = "oriente/attachments",
        public_id: Optional[str] = None,
        resource_type: str = "auto"
    ) -> Dict:
        """
        Faz upload de um arquivo para o Cloudinary

        Args:
            file_path: Caminho do arquivo local
            folder: Pasta no Cloudinary (padrão: oriente/attachments)
            public_id: ID público personalizado (opcional)
            resource_type: Tipo do recurso (auto, image, video, raw)

        Returns:
            Dict com informações do arquivo enviado (url, public_id, etc)

        Raises:
            Exception: Se Cloudinary não estiver configurado ou houver erro no upload
        """
        if not settings.use_cloudinary:
            raise Exception("Cloudinary não está configurado. Verifique as variáveis de ambiente.")

        upload_options = {
            "folder": folder,
            "resource_type": resource_type,
            "use_filename": True,
            "unique_filename": True,
        }

        if public_id:
            upload_options["public_id"] = public_id

        result = cloudinary.uploader.upload(file_path, **upload_options)

        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "format": result.get("format"),
            "resource_type": result.get("resource_type"),
            "bytes": result.get("bytes"),
            "width": result.get("width"),
            "height": result.get("height"),
            "created_at": result.get("created_at")
        }

    def upload_from_bytes(
        self,
        file_bytes: bytes,
        filename: str,
        folder: str = "oriente/attachments",
        resource_type: str = "auto"
    ) -> Dict:
        """
        Faz upload de um arquivo a partir de bytes

        Args:
            file_bytes: Bytes do arquivo
            filename: Nome do arquivo
            folder: Pasta no Cloudinary
            resource_type: Tipo do recurso

        Returns:
            Dict com informações do arquivo enviado
        """
        if not settings.use_cloudinary:
            raise Exception("Cloudinary não está configurado. Verifique as variáveis de ambiente.")

        # Criar arquivo temporário
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{filename}") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            result = self.upload_file(tmp_path, folder, resource_type=resource_type)
        finally:
            # Remover arquivo temporário
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        return result

    def delete_file(self, public_id: str, resource_type: str = "image") -> Dict:
        """
        Deleta um arquivo do Cloudinary

        Args:
            public_id: ID público do arquivo no Cloudinary
            resource_type: Tipo do recurso (image, video, raw)

        Returns:
            Dict com resultado da operação
        """
        if not settings.use_cloudinary:
            raise Exception("Cloudinary não está configurado.")

        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        return result

    def get_file_url(
        self,
        public_id: str,
        transformation: Optional[Dict] = None
    ) -> str:
        """
        Gera URL de um arquivo no Cloudinary

        Args:
            public_id: ID público do arquivo
            transformation: Transformações a aplicar (resize, crop, etc)

        Returns:
            URL do arquivo
        """
        if not settings.use_cloudinary:
            raise Exception("Cloudinary não está configurado.")

        options = {"secure": True}
        if transformation:
            options["transformation"] = transformation

        url, _ = cloudinary.utils.cloudinary_url(public_id, **options)
        return url

    def is_configured(self) -> bool:
        """
        Verifica se o Cloudinary está configurado

        Returns:
            True se configurado, False caso contrário
        """
        return settings.use_cloudinary


# Instância global do serviço
cloudinary_service = CloudinaryService()
