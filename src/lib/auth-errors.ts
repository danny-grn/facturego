const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Confirmez votre adresse email avant de vous connecter.",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères.",
};

export function translateAuthError(message: string) {
  return MESSAGES[message] ?? message ?? "Une erreur est survenue, réessayez.";
}
