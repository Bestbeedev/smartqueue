/**
 * Landing Page - Page d'accueil premium
 * Design moderne avec animations et sections complètes
 * Support dark mode complet
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Star, Users, Clock, TrendingUp, Shield, Zap, Crown, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('individual')

  const features = [
    {
      icon: Users,
      title: 'Gestion des Files d\'Attente',
      description: 'Éliminez les files d\'attente physiques et optimisez le flux de clients avec un système numérique intelligent.'
    },
    {
      icon: Clock,
      title: 'Temps d\'Attente Réduit',
      description: 'Réduisez le temps d\'attente moyen de 30% et améliorez la satisfaction client.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics en Temps Réel',
      description: 'Suivez les performances, identifiez les goulots d\'étranglement et prenez des décisions data-driven.'
    },
    {
      icon: Shield,
      title: 'Sécurité & Conformité',
      description: 'Données cryptées, sauvegardes automatiquement et conformes RGPD.'
    }
  ]

  const pricing = [
    {
      name: 'Starter',
      price: '29',
      period: '/mois',
      description: 'Parfait pour les petites entreprises',
      features: [
        'Jusqu\'à 50 clients/jour',
        '1 point de service',
        'Analytics basic',
        'Support email'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '79',
      period: '/mois',
      description: 'Idéal pour les entreprises en croissance',
      features: [
        'Jusqu\'à 200 clients/jour',
        '3 points de service',
        'Analytics avancées',
        'Support prioritaire'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '199',
      period: '/mois',
      description: 'Pour les grandes organisations',
      features: [
        'Clients illimités',
        'Points de service illimités',
        'Analytics personnalisées',
        'Support dédié 24/7'
      ],
      popular: false
    }
  ]

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Gérante de Restaurant',
      content: 'SmartQueue a transformé notre service. Le temps d\'attente a diminué de 60% et nos clients sont plus satisfaits.',
      rating: 5
    },
    {
      name: 'Jean Martin',
      role: 'Directeur de Banque',
      content: 'Une solution intuitive qui s\'intègre parfaitement à nos systèmes existants. Le ROI a été atteint en 3 mois.',
      rating: 5
    },
    {
      name: 'Sophie Laurent',
      role: 'Responsable Pharmacie',
      content: 'L\'application mobile est excellente, nos clients apprécient de pouvoir voir leur position en temps réel.',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold">
                SQ
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
                SmartQueue
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Tarifs
              </a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Témoignages
              </a>
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-500 transition-all"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <div className="w-6 h-0.5 bg-current"></div>
              <div className="w-6 h-0.5 bg-current mt-1"></div>
              <div className="w-6 h-0.5 bg-current mt-1"></div>
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <a href="#features" className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Fonctionnalités
              </a>
              <a href="#pricing" className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Tarifs
              </a>
              <a href="#testimonials" className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Témoignages
              </a>
              <Link
                to="/login"
                className="block px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Se connecter
              </Link>
              <Link
                to="/signup"
                className="block px-4 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                Commencer gratuitement
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Révolutionnez la gestion
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                des files d'attente
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              La solution SaaS la plus complète pour éliminer les files d'attente physiques et optimiser l'expérience client.
              <span className="block font-semibold text-blue-600 dark:text-blue-400 mt-2">
                30% de temps d'attente en moins, garanti.
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
              Se connecter
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">50%</div>
              <div className="text-gray-600 dark:text-gray-300">Réduction du temps d'attente</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">1000+</div>
              <div className="text-gray-600 dark:text-gray-300">Entreprises satisfaites</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">4.9/5</div>
              <div className="text-gray-600 dark:text-gray-300">Note moyenne des clients</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fonctionnalités
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                qui font la différence
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Tout ce dont vous avez besoin pour gérer efficacement vos files d'attente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex gap-6 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Des tarifs
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                pour tous les besoins
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Choisissez le plan qui correspond à votre taille d'entreprise
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={cn(
                  'relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl hover:scale-105',
                  plan.popular
                    ? 'border-purple-500 ring-4 ring-purple-100 dark:ring-purple-900'
                    : 'border-gray-200 dark:border-gray-600'
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-purple-400 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Plus populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">{plan.price}€</span>
                    <span className="text-gray-600 dark:text-gray-300 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/signup"
                  className={cn(
                    'w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 text-center block',
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:from-purple-700 hover:to-purple-500 shadow-lg'
                      : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                  )}
                >
                  Choisir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ce que disent
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                nos clients
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Rejoignez des milliers d'entreprises qui font confiance à SmartQueue
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Prêt à révolutionner
            <span className="block">
              votre gestion des files ?
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des milliers d'entreprises qui optimisent déjà leur service client
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              Voir une démo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                  SQ
                </div>
                <span className="text-xl font-bold text-white">SmartQueue</span>
              </div>
              <p className="text-gray-400 text-sm">
                La solution SaaS la plus complète pour la gestion des files d'attente
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Démo</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Aide</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} SmartQueue. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
