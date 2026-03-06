/**
 * Signup/Onboarding Admin
 * Page d'inscription pour les administrateurs d'établissement.
 * - Utilise la route register standard avec rôle admin
 * - Redirection vers subscription après création
 * - Design identique à l'ancien signup mais adapté pour admin
 */
import { FormEvent, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { signup } from "@/store/authSlice";
import { Navigate, Link } from "react-router-dom";
import { Lock, Mail, User, Phone, AlertCircle, Building,Eye, EyeOff} from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signupSchema, type SignupFormData } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

export default function Signup() {
  const dispatch = useAppDispatch();
  const { token, loading, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const watchedPassword = watch("password");

  if (token) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (data: SignupFormData) => {
    try {
      const result = await dispatch(signup({
        name: data.name!,
        email: data.email!,
        password: data.password!,
        password_confirmation: data.password_confirmation!,
        phone: data.phone
      })).unwrap();
      toast.success("Compte créé avec succès !");
      // Redirection vers la page d'abonnement
      window.location.href = "/subscription";
    } catch (error: any) {
      const status = error?.status;
      if (status === 422) {
        toast.error("Données invalides. Veuillez vérifier les champs.");
      } else if (status === 409) {
        toast.error("Un compte avec cet email existe déjà.");
      } else if (status >= 500) {
        toast.error("Erreur serveur. Veuillez réessayer plus tard.");
      } else {
        toast.error("Erreur d'inscription. Veuillez réessayer.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">SQ</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Créer votre compte établissement
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Commencez avec SmartQueue pour votre entreprise
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Nom de l'administrateur
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="name"
                    {...register("name")}
                    type="text"
                    className={cn(
                      "focus:ring-primary focus:border-primary block w-full pl-10 pr-3 py-2 sm:text-sm border-border bg-background rounded-md placeholder:text-muted-foreground",
                      errors.name &&
                        "border-red-500 focus:ring-red-500 focus:border-red-500",
                    )}
                    placeholder="Jean Dupont"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Téléphone (optionnel)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="phone"
                    {...register("phone")}
                    type="tel"
                    className="focus:ring-primary focus:border-primary block w-full pl-10 pr-3 py-2 sm:text-sm border-border bg-background rounded-md placeholder:text-muted-foreground"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Email de l'administrateur
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className={cn(
                    "focus:ring-primary focus:border-primary block w-full pl-10 pr-3 py-2 sm:text-sm border-border bg-background rounded-md placeholder:text-muted-foreground",
                    errors.email &&
                      "border-red-500 focus:ring-red-500 focus:border-red-500",
                  )}
                  placeholder="admin@entreprise.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Mot de passe
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={cn(
                      "focus:ring-primary focus:border-primary block w-full pl-10 pr-10 py-2 sm:text-sm border-border bg-background rounded-md placeholder:text-muted-foreground",
                      errors.password &&
                        "border-red-500 focus:ring-red-500 focus:border-red-500",
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
                {watchedPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={cn(
                          "w-16 h-1 rounded",
                          watchedPassword.length >= 8
                            ? "bg-green-500"
                            : "bg-gray-300",
                        )}
                      />
                      <span className="text-muted-foreground">
                        {watchedPassword.length >= 8
                          ? "Sécurisé"
                          : "8 caractères min."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="password_confirmation"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="password_confirmation"
                    {...register("password_confirmation")}
                    type={showPasswordConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    className={cn(
                      "focus:ring-primary focus:border-primary block w-full pl-10 pr-10 py-2 sm:text-sm border-border bg-background rounded-md placeholder:text-muted-foreground",
                      errors.password_confirmation &&
                        "border-red-500 focus:ring-red-500 focus:border-red-500",
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswordConfirm ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password_confirmation.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-foreground"
              >
                J'accepte les{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  conditions d'utilisation
                </a>{" "}
                et la{" "}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  politique de confidentialité
                </a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Création du compte...
                  </>
                ) : (
                  "Créer mon compte établissement"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  <span className="text-xs">DÉJÀ UN COMPTE ?</span>
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 text-sm"
              >
                Se connecter à un compte existant
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} SmartQueue. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}
