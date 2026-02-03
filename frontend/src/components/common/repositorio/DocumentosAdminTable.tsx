import { useState, useEffect } from 'react'
import { documentosService, type Documento } from '@/api/services/documentosService'
import { useAuth } from '@/api/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  FileType, 
  Loader2, 
  Trash2, 
  Eye,
  Search,
  Plus
} from 'lucide-react'
import { SubirDocumentoUltraSimple } from './SubirSocumentoUltraSimple'
import FileDownload from '../buttons/FileDownload'

export function DocumentosAdminTable() {
  const { user } = useAuth()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  // Verificar si el usuario puede subir/eliminar (nivel >= 3)
  const puedeGestionar = (user?.rol_nivel ?? 0) >= 3

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await documentosService.getAll()
      
      if (response && response.results) {
        setDocumentos(response.results)
      } else if (Array.isArray(response)) {
        setDocumentos(response)
      } else {
        setDocumentos([])
      }
    } catch (err) {
      console.error('Error al cargar documentos:', err)
      setError('Error al cargar los documentos')
      setDocumentos([])
    } finally {
      setLoading(false)
    }
  }

  // --- NUEVA FUNCIÓN PARA VISUALIZAR CON TOKEN ---
  const handleVisualizar = async (id: string, mimeType: string) => {
    try {
      // Usamos el servicio que ya maneja el token y devuelve un Blob
      const blob = await documentosService.download(id);
      
      // Creamos una URL temporal para el blob
      // Forzamos el tipo de contenido si es necesario para que el navegador sepa abrirlo
      const file = new Blob([blob], { type: mimeType || 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      // Abrimos en una pestaña nueva
      window.open(fileURL, '_blank');
      
      // Opcional: limpiar la URL después de un tiempo
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
    } catch (error) {
      console.error('Error al visualizar el documento:', error);
      alert('No se pudo cargar la previsualización del documento.');
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return
    }

    try {
      await documentosService.delete(id)
      setDocumentos(prev => prev.filter(doc => doc.id !== id))
    } catch (error) {
      console.error('Error al eliminar documento:', error)
      alert('Error al eliminar el documento')
    }
  }

  const getIconoPorExtension = (extension: string) => {
    const ext = extension.toLowerCase()
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-600" />
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) 
      return <ImageIcon className="w-5 h-5 text-blue-600" />
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) 
      return <Video className="w-5 h-5 text-purple-600" />
    return <FileType className="w-5 h-5 text-green-600" />
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  const documentosFiltrados = documentos.filter(doc =>
    doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.nombre_archivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.codigo_documento.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Cargando documentos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {puedeGestionar && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Subir Documento
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Descargas</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No se encontraron documentos
                </TableCell>
              </TableRow>
            ) : (
              documentosFiltrados.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-mono text-sm">
                    {doc.codigo_documento}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIconoPorExtension(doc.extension)}
                      <span className="text-sm">{doc.tipo_display}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={doc.titulo}>
                    {doc.titulo}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {doc.nombre_archivo}
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.categoria_nombre}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatBytes(doc.tamano)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(doc.subido_en)}
                  </TableCell>
                  <TableCell className="text-sm text-center">
                    {doc.descargas}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end items-center">
                      {/* Botón de Visualizar corregido */}
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Visualizar"
                        onClick={() => handleVisualizar(doc.id, doc.mime_type)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {/* Botón de Descarga (Tu componente existente) */}
                      <FileDownload
                        documentId={doc.id}
                        fileName={doc.nombre_archivo}
                        fileType={doc.mime_type}
                        iconClassName="w-4 h-4 text-blue-600 cursor-pointer hover:text-blue-800"
                      />

                      {/* Botón de Eliminar */}
                      {puedeGestionar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(doc.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SubirDocumentoUltraSimple
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={cargarDocumentos}
      />
    </div>
  )
}