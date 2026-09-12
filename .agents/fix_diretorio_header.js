const fs = require('fs');

const currentCode = fs.readFileSync('src/routes/_store.diretorio.index.tsx', 'utf8');

const header = `import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  CheckCircle,
  MapPin,
  Clock,
  WhatsappLogo,
  Heartbeat,
  Wrench,
  CarProfile,
  Briefcase,
  Star,
  ArrowRight,
  Storefront,
  ShieldCheck,
  Phone,
  ShareNetwork,
  Image as ImageIcon,
  AirplaneTilt,
  ForkKnife,
  Sparkle,
} from "@phosphor-icons/react";
import { getPublicDirectory, type DirectoryListingDTO } from "@/services/directory.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { EmptyState } from "@/components/state/states";
import { resolveNicheDepartments } from "@/lib/niche-helpers";

const DIRECTORY_CATEGORIES: FilterChipOption[] = [
  { id: "todos", label: "Tudo", emoji: "🏢", icon: Tag },
  { id: "turismo", label: "Turismo & Viagens", emoji: "✈️", icon: AirplaneTilt },
  { id: "gastronomia", label: "Gastronomia & Bares", emoji: "🍽️", icon: ForkKnife },
`;

fs.writeFileSync('src/routes/_store.diretorio.index.tsx', header + currentCode, 'utf8');
console.log('Restored successfully!');
