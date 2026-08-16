import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Checa se o consentimento já foi aceito no localStorage
    const localConsent = localStorage.getItem("jah_cookie_consent");
    if (localConsent === "accepted") {
      return;
    }

    // 2. Checa se existe cookie persistente de consentimento
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const hasConsentCookie = cookies.some((c) => c.startsWith("jah_cookie_consent=accepted"));
    if (hasConsentCookie) {
      localStorage.setItem("jah_cookie_consent", "accepted");
      return;
    }

    // 3. Se o usuário já está autenticado (tem token do Supabase), o consentimento dos termos já foi dado no cadastro
    const hasAuthToken = Object.keys(localStorage).some((k) => k.includes("-auth-token"));
    const hasAuthCookie = cookies.some((c) => c.includes("sb-") || c.includes("jah_active_tenant"));
    if (hasAuthToken || hasAuthCookie) {
      localStorage.setItem("jah_cookie_consent", "accepted");
      document.cookie = "jah_cookie_consent=accepted; path=/; max-age=315360000; SameSite=Lax";
      return;
    }

    // 4. Apenas se for um visitante 100% anônimo pela primeiríssima vez, exibe o aviso suavemente
    setShow(true);
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      // 1. Grava no localStorage
      localStorage.setItem("jah_cookie_consent", "accepted");

      // 2. Grava cookie com validade de 10 anos em path=/
      const isHttps = window.location.protocol === "https:";
      const secureFlag = isHttps ? "; Secure" : "";
      document.cookie = `jah_cookie_consent=accepted; path=/; max-age=315360000; SameSite=Lax${secureFlag}`;
    }

    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-20 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-4xl bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto shadow-2xl">
        <div className="text-xs sm:text-sm text-muted-foreground flex-1">
          <p className="font-bold text-foreground mb-1">Privacidade & Cookies</p>
          Utilizamos cookies essenciais para autenticação, personalização e segurança da sua
          experiência. Ao navegar, você concorda com nossos{" "}
          <Link to="/termos" className="underline font-semibold hover:text-foreground">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link to="/privacidade" className="underline font-semibold hover:text-foreground">
            Política de Privacidade
          </Link>
          .
        </div>
        <div className="flex shrink-0 gap-3 w-full sm:w-auto">
          <Button
            onClick={handleAccept}
            className="w-full sm:w-auto font-bold rounded-xl bg-primary text-primary-foreground shadow-xs text-xs h-10 px-5"
          >
            Entendi e Aceito
          </Button>
        </div>
      </div>
    </div>
  );
}

