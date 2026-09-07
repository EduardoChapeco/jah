import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function BiometriaFacial() {
    const navigate = useNavigate();
    const { pessoa } = useAuth();
    // @ts-ignore
    const currentStatus = pessoa?.facial_status || 'pendente';
    // @ts-ignore
    const currentPhoto = pessoa?.foto_facial_url;

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        await uploadPhoto(file);
    };

    const uploadPhoto = async (file: File) => {
        if (!pessoa) return;
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `biometry/${pessoa.id}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars') // reusing avatars bucket for demo
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update person record
            const { error: updateError } = await supabase
                .from('pessoas')
                .update({
                    // @ts-ignore
                    foto_facial_url: publicUrl,
                    // @ts-ignore
                    facial_status: 'aprovado' // Auto-approve for demo
                })
                .eq('id', pessoa.id);

            if (updateError) throw updateError;

            toast.success('Biometria cadastrada com sucesso!');
            navigate('/perfil');
            // Force reload or re-auth would be ideal to update context
            window.location.reload();

        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao enviar foto: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="p-4 flex items-center gap-2 border-b">
                <Button variant="ghost" size="icon" onClick={() => navigate('/perfil')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold">Biometria Facial</h1>
            </header>

            <main className="flex-1 p-6 flex flex-col items-center justify-center space-y-8 max-w-md mx-auto w-full">

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Cadastro Facial</h2>
                    <p className="text-muted-foreground">
                        Precisamos de uma foto recente do seu rosto para validação de identidade e acesso aos eventos.
                    </p>
                </div>

                <Card className="w-full border-2 border-dashed border-gray-200 overflow-hidden relative group">
                    <CardContent className="p-0 aspect-square flex flex-col items-center justify-center bg-gray-50">
                        {currentPhoto ? (
                            <img src={currentPhoto} alt="Biometria" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                <div className="p-4 bg-gray-100 rounded-2xl">
                                    <Camera className="h-12 w-12" />
                                </div>
                                <p className="text-sm font-medium">Nenhuma foto cadastrada</p>
                            </div>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin rounded-xl h-10 w-10 border-b-2 border-white"></div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="w-full space-y-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <Button
                        size="lg"
                        className="w-full rounded-lg h-12 text-base font-semibold gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Camera className="h-5 w-5" />
                        {currentPhoto ? 'Atualizar Foto' : 'Tirar Foto Agora'}
                    </Button>

                    <p className="text-xs text-center text-gray-400">
                        Certifique-se de estar em um ambiente bem iluminado.
                    </p>
                </div>

                {currentStatus === 'aprovado' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Biometria Aprovada
                    </div>
                )}
            </main>
        </div>
    );
}
