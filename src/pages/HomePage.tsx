import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Truck,
  Shirt,
  Search,
  Receipt,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatFCFA } from '@/lib/format';

export default function HomePage() {
  const { user, homeForRole } = useAuth();
  const navigate = useNavigate();
  const [quickTicket, setQuickTicket] = useState('');

  const onQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTicket.trim()) {
      navigate(`/client/access?ticket=${encodeURIComponent(quickTicket.trim().toUpperCase())}`);
    } else {
      navigate('/client/access');
    }
  };

  return (
    <div className="min-h-screen bg-surface text-navy">
      {/* ── Barre de navigation supérieure ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white shadow-md shadow-navy/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-xl font-bold tracking-tight text-navy">
              Press<span className="text-slate-500 font-medium">Net</span>
            </span>
          </Link>

          {/* Liens de navigation centraux */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#fonctionnalites" className="transition-colors hover:text-navy">
              Fonctionnalités
            </a>
            <a href="#services" className="transition-colors hover:text-navy">
              Services
            </a>
            <a href="#tarifs" className="transition-colors hover:text-navy">
              Catalogue
            </a>
            <a href="#suivi-client" className="transition-colors hover:text-navy">
              Suivi client
            </a>
          </nav>

          {/* Boutons d'action droite */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to={homeForRole(user.role)} className="btn-primary !py-2.5">
                Accéder à mon tableau de bord
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  to="/client/access"
                  className="hidden rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy sm:inline-flex"
                >
                  Suivre un ticket
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary !py-2 !px-4 text-xs font-semibold sm:text-sm"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="btn-primary !py-2 !px-4 text-xs font-semibold sm:text-sm"
                >
                  Inscrire mon pressing
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section (Inspiration Laundra : Élégance, clarté, blanc & bleu marine) ── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Texte & Titre principal */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                La solution SaaS dédiée aux pressings professionnels
              </div>

              <h1 className="mt-6 text-4xl leading-[1.15] font-extrabold tracking-tight text-navy sm:text-5xl lg:text-6xl">
                La gestion de pressing repensée avec{' '}
                <span className="text-slate-500">rigueur & élégance.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Fini les carnets papier et les tickets perdus. PressNet centralise vos dépôts au comptoir, vos encaissements Mobile Money, vos créances et le suivi de vos linges prêts dans une interface fluide et instantanée.
              </p>

              {/* Barre de recherche directe de ticket */}
              <form onSubmit={onQuickSearch} className="mt-8 flex max-w-lg flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={quickTicket}
                    onChange={(e) => setQuickTicket(e.target.value)}
                    placeholder="Entrez votre n° de ticket (ex: PR-0001)..."
                    className="input-base pl-10 text-sm focus:!bg-white"
                  />
                </div>
                <button type="submit" className="btn-primary shrink-0 !py-2.5">
                  Vérifier mon linge
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Rassurance / Points forts */}
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200/70 pt-8">
                <div>
                  <p className="text-2xl font-bold text-navy tabular-nums">100%</p>
                  <p className="mt-1 text-xs text-slate-500">Traçabilité des articles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy tabular-nums">0 FCFA</p>
                  <p className="mt-1 text-xs text-slate-500">De créance oubliée</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy tabular-nums">Orange & Moov</p>
                  <p className="mt-1 text-xs text-slate-500">Paiements intégrés</p>
                </div>
              </div>
            </div>

            {/* Galerie visuelle : Machines & Soin du linge (SANS HUMAINS) */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Image principale : Machines professionnelles */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
                  <img
                    src="/images/machines-pressing.jpg"
                    alt="Machines à laver professionnelles de pressing"
                    className="h-80 w-full object-cover object-center transition-transform duration-500 hover:scale-105 sm:h-96"
                  />
                  <div className="p-5 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-navy">Équipements professionnels</p>
                        <p className="text-xs text-slate-500">Nettoyage à sec, lavage à l'eau & repassage soigné</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Qualité certifiée
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge flottant 1 : Linge plié */}
                <div className="absolute -top-6 -left-6 hidden rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm sm:flex sm:items-center sm:gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
                    <Shirt size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-navy">Finition pressing impeccable</p>
                    <p className="text-[11px] text-slate-500">Pliage soigné & cintres fournis</p>
                  </div>
                </div>

                {/* Badge flottant 2 : Notification client */}
                <div className="absolute -bottom-6 -right-4 rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <CheckCircle2 size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-navy">SMS automatique envoyé</p>
                    <p className="text-[11px] text-slate-500">« Votre commande est prête ! »</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Fonctionnalités Métier ── */}
      <section id="fonctionnalites" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Architecture complète</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Conçu spécifiquement pour la réalité d'un pressing.
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Chaque détail répond à un besoin concret : rapidité au comptoir, suivi de l'avancement, gestion des impayés et coordination des retraits.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-6 transition-all hover:shadow-card-hover">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white shadow-sm">
                <Receipt size={22} />
              </span>
              <h3 className="mt-5 text-base font-bold text-navy">Dépôt & Ticket unique</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Génération instantanée de ticket numéroté propre à votre pressing. Enregistrement rapide des chemises, costumes et linges traditionnels.
              </p>
            </div>

            <div className="card p-6 transition-all hover:shadow-card-hover">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white shadow-sm">
                <Layers size={22} />
              </span>
              <h3 className="mt-5 text-base font-bold text-navy">Cycle de traitement clair</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Passez vos commandes de <em>Reçu</em> à <em>En traitement</em>, puis <em>Prêt</em> et <em>Livré</em>. Visibilité immédiate pour toute l'équipe.
              </p>
            </div>

            <div className="card p-6 transition-all hover:shadow-card-hover">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white shadow-sm">
                <CreditCard size={22} />
              </span>
              <h3 className="mt-5 text-base font-bold text-navy">Encaissement & Créances</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Règlements comptant en espèces ou Mobile Money. Tableau des créances impayées avec liste nominative des clients débiteurs.
              </p>
            </div>

            <div className="card p-6 transition-all hover:shadow-card-hover">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-white shadow-sm">
                <Truck size={22} />
              </span>
              <h3 className="mt-5 text-base font-bold text-navy">Collecte & Livraison</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Assignation d'un coursier, gestion des collectes à domicile et suivi d'itinéraire dédié sur smartphone pour les livreurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Galerie Visuelle & Savoir-faire ── */}
      <section id="services" className="py-20 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Grille de 2 photographies sans humains */}
            <div className="grid grid-cols-2 gap-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <img
                  src="/images/chemises-cintres.jpg"
                  alt="Chemises et vestes suspendues sur cintres"
                  className="h-64 w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                />
                <div className="p-4">
                  <p className="text-xs font-bold text-navy">Repassage sur cintres</p>
                  <p className="text-[11px] text-slate-500">Pour chemises, vestes et costumes</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <img
                  src="/images/vetements-plies.jpg"
                  alt="Linge plié et serviettes sur étagère"
                  className="h-64 w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                />
                <div className="p-4">
                  <p className="text-xs font-bold text-navy">Linge plié & emballé</p>
                  <p className="text-[11px] text-slate-500">Draps, couvertures et couettes</p>
                </div>
              </div>
            </div>

            {/* Texte descriptif */}
            <div className="space-y-6">
              <span className="section-label">Savoir-faire et organisation</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Zéro vêtement égaré, des délais de retrait respectés.
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Grâce au tableau de bord des linges prêts non réclamés depuis plus de 7 jours, vous évitez l'encombrement des portants et relancez directement vos clients par téléphone ou SMS en un seul clic.
              </p>

              <ul className="space-y-3.5">
                {[
                  'Alertes automatiques pour le linge en attente depuis > 7 jours',
                  'Fiches clients unifiées avec historique complet des dépôts',
                  'Tarification transparente personnalisable pour chaque établissement',
                  'Application installable sur mobile (PWA) avec fonctionnement hors-ligne',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-navy">
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link to="/register" className="btn-primary">
                  Inscrire votre établissement
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section Catalogue Indicatif ── */}
      <section id="tarifs" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-label">Grille tarifaire standard</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Des tarifs clairs et ajustables à votre politique.
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Chaque pressing paramètre son propre catalogue dans l'espace d'administration. Voici les références courantes sur le marché :
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { item: 'Chemise', price: 500, cat: 'Vêtements' },
              { item: 'Pantalon', price: 750, cat: 'Vêtements' },
              { item: 'Robe', price: 1000, cat: 'Vêtements' },
              { item: 'Costume', price: 3000, cat: 'Vêtements' },
              { item: 'Boubou', price: 2000, cat: 'Traditionnel' },
              { item: 'Drap', price: 1500, cat: 'Maison' },
            ].map(({ item, price, cat }) => (
              <div key={item} className="rounded-xl border border-slate-200/80 bg-surface p-4 text-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">{cat}</span>
                <p className="mt-1 font-bold text-navy">{item}</p>
                <p className="mt-2 text-base font-extrabold text-navy tabular-nums">{formatFCFA(price)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section Appel à l'action Final ── */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
            Prêt à moderniser la gestion de votre pressing ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Rejoignez les pressings qui gagnent du temps chaque jour, sécurisent leurs encaissements et fidélisent leur clientèle.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-secondary !bg-white !text-navy hover:!bg-slate-100 !py-3 !px-6 font-bold shadow-lg">
              Créer mon compte pressing
            </Link>
            <Link to="/login" className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-[#102238] py-12 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M3 12h18M3 18h12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-lg font-bold text-white">PressNet</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                La plateforme SaaS de référence pour la gestion de pressing, blanchisserie et teinturerie.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">Accès rapides</p>
              <ul className="mt-3 space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-white">Connexion équipe</Link></li>
                <li><Link to="/register" className="hover:text-white">Inscrire un établissement</Link></li>
                <li><Link to="/client/access" className="hover:text-white">Espace client & Suivi ticket</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">Fonctionnalités</p>
              <ul className="mt-3 space-y-2 text-xs">
                <li><span>Gestion comptoir & tickets</span></li>
                <li><span>Paiements Orange & Moov</span></li>
                <li><span>Suivi des créances débiteurs</span></li>
                <li><span>Missions de livraison</span></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold tracking-wider text-white uppercase">Sécurité & PWA</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Compatible smartphone, tablette et ordinateur de bureau. Fonctionne hors-ligne avec synchronisation sécurisée.
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800/80 pt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} PressNet. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
