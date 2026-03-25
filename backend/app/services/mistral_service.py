"""
Mistral AI narrative report generation service.

Collects all quantitative metrics (VaR, Monte Carlo, Markowitz, stress tests)
and builds a structured prompt for mistral-small-latest to generate a
professional risk officer report in French.

Model: mistral-small-latest
Max tokens: 2500
Temperature: 0.3

Depends on: mistralai, app.core.config
Used by: api/v1/report.py
"""

import logging
from datetime import datetime

from mistralai.client import Mistral

from app.core.config import settings

logger = logging.getLogger(__name__)

_MODEL = "mistral-small-latest"
_MAX_TOKENS = 2500
_TEMPERATURE = 0.3


_LOCALE_INSTRUCTIONS = {
    "fr": "Réponds en français.",
    "en": "Reply in English.",
    "es": "Responde en español.",
    "zh": "请用中文回答。",
}


def _build_prompt(
    portfolio_name: str,
    assets: list[dict[str, str | float]],
    risk_summary: dict,
    montecarlo: dict,
    markowitz: dict,
    stress: dict,
    locale: str = "fr",
) -> str:
    """
    Build the structured prompt for Mistral.

    Args:
        portfolio_name: Name of the portfolio
        assets: List of {ticker, weight} dicts
        risk_summary: VaR/CVaR/return/vol metrics
        montecarlo: Monte Carlo summary stats
        markowitz: Min variance and max Sharpe weights + performance
        stress: Scenario results (drawdowns)

    Returns:
        Formatted prompt string
    """
    composition = "\n".join(
        f"  - {a['ticker']}: {float(a['weight']) * 100:.1f}%"
        for a in assets
    )

    scenario_lines: list[str] = []
    for s in stress.get("scenarios", []):
        recovery = "Non récupéré" if s["recovery_days"] is None else f"{s['recovery_days']} jours"
        scenario_lines.append(
            f"  - {s['scenario_name']}: total_return={s['total_return']:.2%}, "
            f"max_drawdown={s['max_drawdown']:.2%}, "
            f"recovery={recovery}"
        )
    scenarios_text = "\n".join(scenario_lines)

    min_var_weights = markowitz.get("min_variance", {}).get("weights", {})
    max_sharpe_weights = markowitz.get("max_sharpe", {}).get("weights", {})

    min_var_text = ", ".join(
        f"{t}: {w * 100:.1f}%" for t, w in min_var_weights.items()
    )
    max_sharpe_text = ", ".join(
        f"{t}: {w * 100:.1f}%" for t, w in max_sharpe_weights.items()
    )

    today = datetime.now().strftime("%d/%m/%Y")

    language_instruction = _LOCALE_INSTRUCTIONS.get(locale, _LOCALE_INSTRUCTIONS["fr"])

    return f"""{language_instruction}
Tu es un moteur d'analyse de risque automatisé.
Ne laisse AUCUN placeholder entre crochets dans ta réponse.
Utilise uniquement les données fournies ci-dessous.
N'invente aucune information manquante.
Ne génère PAS d'en-tête avec un nom de banque, un nom d'analyste ou une date de rédaction.
Commence directement par la première section d'analyse.

=== MÉTADONNÉES ===
Outil : RiskLens (analyse automatisée)
Date du rapport : {today}

=== PORTEFEUILLE ===
Nom : {portfolio_name}
Composition :
{composition}

=== MÉTRIQUES DE RISQUE ===
VaR 95% historique : {risk_summary.get('var_95_historical', 0):.4%}
VaR 99% historique : {risk_summary.get('var_99_historical', 0):.4%}
CVaR 95% : {risk_summary.get('cvar_95', 0):.4%}
CVaR 99% : {risk_summary.get('cvar_99', 0):.4%}
Rendement annualisé : {risk_summary.get('annualized_return', 0):.2%}
Volatilité annualisée : {risk_summary.get('annualized_volatility', 0):.2%}
Ratio de Sharpe : {risk_summary.get('sharpe_ratio', 0):.3f}

=== SIMULATION MONTE CARLO (10 000 trajectoires, 252 jours) ===
Valeur finale moyenne : {montecarlo.get('mean_final_value', 0):.4f}
Valeur finale médiane : {montecarlo.get('median_final_value', 0):.4f}
Probabilité de perte : {montecarlo.get('probability_of_loss', 0):.2%}
VaR 95% simulé : {montecarlo.get('var_95', 0):.4%}

=== STRESS TESTS ===
{scenarios_text}

=== OPTIMISATION MARKOWITZ ===
Portefeuille min variance : {min_var_text}
  → Rendement: {markowitz.get('min_variance', {}).get('expected_return', 0):.2%}, Vol: {markowitz.get('min_variance', {}).get('volatility', 0):.2%}, Sharpe: {markowitz.get('min_variance', {}).get('sharpe_ratio', 0):.3f}
Portefeuille max Sharpe : {max_sharpe_text}
  → Rendement: {markowitz.get('max_sharpe', {}).get('expected_return', 0):.2%}, Vol: {markowitz.get('max_sharpe', {}).get('volatility', 0):.2%}, Sharpe: {markowitz.get('max_sharpe', {}).get('sharpe_ratio', 0):.3f}

=== INSTRUCTIONS ===
Rédige un rapport exhaustif et détaillé en markdown.
Chaque section doit contenir au minimum 3-4 paragraphes ou un tableau structuré.
Ne résume pas — développe chaque point avec les chiffres fournis.

Structure le rapport en exactement 5 sections avec les titres markdown suivants :

## 1. Profil du portefeuille
- Composition détaillée avec le poids de chaque actif
- Métriques clés : rendement annualisé, volatilité, ratio de Sharpe
- Comparaison sectorielle : identifier les secteurs représentés et commenter la diversification
- Caractériser le profil risque/rendement global du portefeuille

## 2. Analyse des risques
- VaR historique aux niveaux de confiance 95% et 99% : interpréter chaque valeur concrètement (perte maximale attendue sur un jour)
- CVaR 95% et 99% : expliquer la différence avec la VaR et ce que la CVaR révèle sur les queues de distribution
- Simulation Monte Carlo : interpréter la valeur finale moyenne, médiane, la probabilité de perte et la VaR simulée
- Synthèse : le portefeuille est-il conservateur, modéré ou agressif ?

## 3. Analyse des stress tests
- Présenter un tableau markdown avec les colonnes : Scénario | Rendement total | Drawdown max | Jours de recovery
- Pour chaque scénario de crise (2008, 2020, 2022), analyser en détail : contexte historique, impact sur le portefeuille, capacité de recovery
- Comparer les drawdowns du portefeuille actuel vs le portefeuille optimisé (max Sharpe) pour chaque scénario
- Conclure sur la résilience globale du portefeuille face aux crises

## 4. Recommandations de rééquilibrage
- Présenter le portefeuille min variance : composition détaillée, rendement attendu, volatilité, Sharpe — avantages et inconvénients
- Présenter le portefeuille max Sharpe : composition détaillée, rendement attendu, volatilité, Sharpe — avantages et inconvénients
- Comparer les deux avec le portefeuille actuel dans un tableau markdown (colonnes : Métrique | Actuel | Min Variance | Max Sharpe)
- Formuler une recommandation argumentée selon le profil de risque

## 5. Avertissement légal
Ce rapport est généré automatiquement par RiskLens à titre informatif uniquement.
Il ne constitue pas un conseil en investissement. Les performances passées ne préjugent pas des performances futures.
Les résultats des simulations reposent sur des hypothèses statistiques qui peuvent ne pas refléter les conditions futures de marché.

Utilise un ton professionnel et factuel. Utilise des tableaux markdown quand approprié.
RAPPEL : aucun texte entre crochets, aucun placeholder, aucun nom de banque ou d'analyste."""


async def generate_report(
    portfolio_name: str,
    assets: list[dict[str, str | float]],
    risk_summary: dict,
    montecarlo: dict,
    markowitz: dict,
    stress: dict,
    locale: str = "fr",
) -> str:
    """
    Generate a narrative risk report using Mistral AI.

    Args:
        portfolio_name: Name of the portfolio
        assets: List of {ticker, weight} dicts
        risk_summary: Aggregated risk summary metrics
        montecarlo: Monte Carlo simulation summary
        markowitz: Efficient frontier results
        stress: Stress test results

    Returns:
        Generated narrative text (markdown)

    Raises:
        RuntimeError: If Mistral API call fails
    """
    if not settings.mistral_api_key:
        raise RuntimeError("MISTRAL_API_KEY is not configured")

    prompt = _build_prompt(
        portfolio_name, assets, risk_summary, montecarlo, markowitz, stress, locale,
    )

    logger.info("Calling Mistral API (model=%s, max_tokens=%d)", _MODEL, _MAX_TOKENS)

    try:
        client = Mistral(api_key=settings.mistral_api_key)
        response = await client.chat.complete_async(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=_MAX_TOKENS,
            temperature=_TEMPERATURE,
        )

        if not response or not response.choices:
            raise RuntimeError("Mistral API returned empty response")

        content = response.choices[0].message.content
        # Do not log full response — may contain user portfolio data
        logger.info("Mistral report generated successfully")
        return content  # type: ignore[return-value]

    except RuntimeError:
        raise
    except Exception as e:
        logger.error("Mistral API call failed: %s", str(e))
        raise RuntimeError(f"Mistral API error: {str(e)}") from e
