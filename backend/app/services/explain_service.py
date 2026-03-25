"""
Mistral AI chart explanation service.

Generates short, mode-aware explanations for each chart type
using mistral-small-latest. No caching — explanations are lightweight
and contextual to the current data.

Model: mistral-small-latest
Max tokens: 300
Temperature: 0.3

Depends on: mistralai, app.core.config
Used by: api/v1/risk.py, api/v1/markowitz.py, api/v1/stress.py
"""

import logging
from typing import Literal

from mistralai.client import Mistral

from app.core.config import settings

logger = logging.getLogger(__name__)

_MODEL = "mistral-small-latest"
_MAX_TOKENS = 300
_TEMPERATURE = 0.3

_LOCALE_INSTRUCTIONS = {
    "fr": "Réponds en français.",
    "en": "Reply in English.",
    "es": "Responde en español.",
    "zh": "请用中文回答。",
}


def _suffix(locale: str = "fr") -> str:
    """Build the suffix instruction with the correct language directive."""
    lang = _LOCALE_INSTRUCTIONS.get(locale, _LOCALE_INSTRUCTIONS["fr"])
    return (
        f"{lang} Ne dépasse pas 4 phrases. "
        "Ne laisse aucun placeholder. "
        "Commence directement par l'analyse, pas par une introduction."
    )


async def _call_mistral(prompt: str) -> str:
    """
    Send a prompt to Mistral and return the text response.

    Raises:
        RuntimeError: If MISTRAL_API_KEY is missing or API call fails.
    """
    if not settings.mistral_api_key:
        raise RuntimeError("MISTRAL_API_KEY is not configured")

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

        return response.choices[0].message.content  # type: ignore[return-value]

    except RuntimeError:
        raise
    except Exception as e:
        logger.error("Mistral explanation call failed: %s", str(e))
        raise RuntimeError(f"Mistral API error: {str(e)}") from e


async def explain_montecarlo(
    mode: Literal["beginner", "expert"],
    mean_final_value: float,
    var_95: float,
    probability_of_loss: float,
    n_simulations: int,
    n_days: int,
    locale: str = "fr",
) -> str:
    """
    Generate a contextual explanation for Monte Carlo simulation results.

    Args:
        mode: beginner or expert
        mean_final_value: Average final portfolio value (1.0 = initial)
        var_95: 95% VaR from simulation (as return, e.g. -0.15)
        probability_of_loss: Probability of ending below initial value
        n_simulations: Number of simulation paths
        n_days: Trading days simulated

    Returns:
        Explanation text in French.
    """
    if mode == "beginner":
        prompt = (
            f"Explique simplement les résultats de cette simulation Monte Carlo "
            f"à un investisseur débutant. "
            f"Valeur finale moyenne : {mean_final_value:.4f} (1.0 = départ). "
            f"Probabilité de perte : {probability_of_loss:.1%}. "
            f"Pire scénario raisonnable (VaR 95%) : {var_95:.2%}. "
            f"Utilise des analogies simples. {_suffix(locale)}"
        )
    else:
        prompt = (
            f"Analyse les résultats de cette simulation Monte Carlo GBM "
            f"({n_simulations} trajectoires, {n_days} jours). "
            f"Mean final value : {mean_final_value:.4f}. "
            f"VaR 95% : {var_95:.4%}. "
            f"P(loss) : {probability_of_loss:.2%}. "
            f"Commente la distribution et le risk-reward. {_suffix(locale)}"
        )

    return await _call_mistral(prompt)


async def explain_distribution(
    mode: Literal["beginner", "expert"],
    var_95: float,
    mean_final_value: float,
    std_final_value: float,
    percentile_5: float,
    percentile_95: float,
    locale: str = "fr",
) -> str:
    """
    Generate a contextual explanation for the loss distribution histogram.

    Args:
        mode: beginner or expert
        var_95: 95% VaR (as return)
        mean_final_value: Mean of final values
        std_final_value: Std dev of final values
        percentile_5: 5th percentile final value
        percentile_95: 95th percentile final value

    Returns:
        Explanation text in French.
    """
    if mode == "beginner":
        prompt = (
            f"Explique simplement cette distribution de pertes et profits "
            f"à un investisseur débutant. "
            f"La ligne rouge VaR 95% est à {var_95:.2%}. "
            f"En moyenne le portefeuille finit à {mean_final_value:.4f} (1.0 = départ). "
            f"Le pire 5% des cas donne {percentile_5:.4f}, "
            f"le meilleur 5% donne {percentile_95:.4f}. "
            f"Utilise un langage accessible. {_suffix(locale)}"
        )
    else:
        prompt = (
            f"Analyse cette distribution empirique des valeurs finales simulées. "
            f"Mean : {mean_final_value:.4f}, Std : {std_final_value:.4f}. "
            f"P5 : {percentile_5:.4f}, P95 : {percentile_95:.4f}. "
            f"VaR 95% : {var_95:.4%}. "
            f"Commente la forme de la distribution (skewness, fat tails). {_suffix(locale)}"
        )

    return await _call_mistral(prompt)


async def explain_markowitz_position(
    mode: Literal["beginner", "expert"],
    current_sharpe: float,
    current_volatility: float,
    current_return: float,
    max_sharpe_ratio: float,
    max_sharpe_volatility: float,
    max_sharpe_return: float,
    min_variance_volatility: float,
    locale: str = "fr",
) -> str:
    """
    Generate a contextual explanation for the portfolio's position on the frontier.

    Args:
        mode: beginner or expert
        current_sharpe: Current portfolio Sharpe ratio
        current_volatility: Current portfolio volatility
        current_return: Current portfolio expected return
        max_sharpe_ratio: Max Sharpe portfolio's Sharpe ratio
        max_sharpe_volatility: Max Sharpe portfolio's volatility
        max_sharpe_return: Max Sharpe portfolio's expected return
        min_variance_volatility: Min variance portfolio's volatility

    Returns:
        Explanation text in French.
    """
    if mode == "beginner":
        prompt = (
            f"Explique simplement la position de ce portefeuille sur la courbe "
            f"d'optimisation à un investisseur débutant. "
            f"Sharpe actuel : {current_sharpe:.2f}, "
            f"meilleur possible : {max_sharpe_ratio:.2f}. "
            f"Volatilité actuelle : {current_volatility * 100:.1f}%, "
            f"minimum possible : {min_variance_volatility * 100:.1f}%. "
            f"Explique si le portefeuille est bien ou mal optimisé. {_suffix(locale)}"
        )
    else:
        prompt = (
            f"Analyse la position du portefeuille sur la frontière efficiente. "
            f"Portefeuille actuel : Sharpe={current_sharpe:.3f}, "
            f"vol={current_volatility:.4%}, return={current_return:.4%}. "
            f"Max Sharpe : Sharpe={max_sharpe_ratio:.3f}, "
            f"vol={max_sharpe_volatility:.4%}, return={max_sharpe_return:.4%}. "
            f"Min Variance vol={min_variance_volatility:.4%}. "
            f"Quantifie l'écart d'efficience. {_suffix(locale)}"
        )

    return await _call_mistral(prompt)


async def explain_markowitz_point(
    mode: Literal["beginner", "expert"],
    point_type: str,
    volatility: float,
    expected_return: float,
    weights: dict[str, float],
    locale: str = "fr",
) -> dict[str, str]:
    """
    Generate a contextual explanation for a specific point on the efficient frontier.

    The AI adopts a different persona based on point_type:
    - min_variance: defensive advisor
    - max_sharpe: optimizer
    - current: diagnostician
    - frontier: neutral analyst

    Returns:
        Dict with 'explanation' and 'suggested_action' keys.
    """
    weights_text = ", ".join(f"{t}: {w:.1%}" for t, w in weights.items()) if weights else "non disponibles"
    sharpe = (expected_return / volatility) if volatility > 0 else 0

    personas = {
        "min_variance": (
            "Tu es un conseiller prudent. Ton rôle : 'Je suis le portefeuille le plus "
            "défensif possible avec vos actifs.'"
        ),
        "max_sharpe": (
            "Tu es un optimisateur. Ton rôle : 'Je suis le meilleur compromis "
            "rendement/risque mathématiquement possible.'"
        ),
        "current": (
            "Tu es un diagnosticien. Ton rôle : 'Voici où vous êtes actuellement "
            "et ce que cela signifie.'"
        ),
        "frontier": (
            "Tu es un analyste neutre. Ce portefeuille représente un équilibre "
            "spécifique entre risque et rendement sur la frontière efficiente."
        ),
    }

    persona = personas.get(point_type, personas["frontier"])

    if mode == "beginner":
        prompt = (
            f"{persona}\n\n"
            f"Explique simplement ce portefeuille à un investisseur débutant.\n"
            f"Volatilité : {volatility:.2%}, Rendement attendu : {expected_return:.2%}, "
            f"Sharpe : {sharpe:.2f}.\n"
            f"Allocation : {weights_text}.\n"
            f"Utilise des analogies simples. Termine par une action concrète suggérée "
            f"en une phrase (commence cette phrase par 'Action suggérée : ').\n"
            f"{_suffix(locale)}"
        )
    else:
        prompt = (
            f"{persona}\n\n"
            f"Analyse ce portefeuille sur la frontière efficiente.\n"
            f"Vol={volatility:.4%}, E(R)={expected_return:.4%}, Sharpe={sharpe:.3f}.\n"
            f"Weights : {weights_text}.\n"
            f"Commente le positionnement risk/return et la concentration. "
            f"Termine par une action concrète suggérée "
            f"en une phrase (commence cette phrase par 'Action suggérée : ').\n"
            f"{_suffix(locale)}"
        )

    text = await _call_mistral(prompt)

    # Split explanation from suggested action
    if "Action suggérée :" in text:
        parts = text.split("Action suggérée :", 1)
        explanation = parts[0].strip()
        suggested_action = parts[1].strip()
    elif "Action suggérée:" in text:
        parts = text.split("Action suggérée:", 1)
        explanation = parts[0].strip()
        suggested_action = parts[1].strip()
    else:
        explanation = text
        suggested_action = ""

    return {"explanation": explanation, "suggested_action": suggested_action}


async def explain_metric(
    metric_name: str,
    metric_value: float,
    mode: Literal["beginner", "expert"],
    context: dict | None = None,
    locale: str = "fr",
) -> str:
    """
    Generate a contextual explanation for a single financial metric.

    Args:
        metric_name: Machine-readable metric key (e.g. var_95, sharpe_ratio)
        metric_value: Numeric value of the metric
        mode: beginner or expert
        context: Optional additional context values

    Returns:
        Explanation text in French.
    """
    ctx_lines = ""
    if context:
        ctx_lines = "\n".join(
            f"  {k}: {v}" for k, v in context.items() if v is not None
        )

    if mode == "beginner":
        prompt = (
            f"Explique simplement la métrique '{metric_name}' à un investisseur débutant. "
            f"Valeur actuelle : {metric_value}. "
        )
        if ctx_lines:
            prompt += f"Contexte supplémentaire :\n{ctx_lines}\n"
        prompt += (
            "Utilise des analogies simples et un langage accessible. "
            "Dis si cette valeur est bonne, mauvaise ou neutre. "
            f"{_suffix(locale)}"
        )
    else:
        prompt = (
            f"Analyse la métrique '{metric_name}' d'un portefeuille financier. "
            f"Valeur : {metric_value}. "
        )
        if ctx_lines:
            prompt += f"Contexte :\n{ctx_lines}\n"
        prompt += (
            "Donne une interprétation technique précise et concise. "
            f"{_suffix(locale)}"
        )

    return await _call_mistral(prompt)


async def explain_stress_result(
    mode: Literal["beginner", "expert"],
    scenarios: list[dict],
    locale: str = "fr",
) -> str:
    """
    Generate a contextual explanation for stress test results.

    Args:
        mode: beginner or expert
        scenarios: List of scenario dicts with scenario_name, total_return,
                   max_drawdown, recovery_days.

    Returns:
        Explanation text in French.
    """
    scenario_lines = []
    has_comparison = False
    for s in scenarios:
        recovery = (
            "non récupéré" if s.get("recovery_days") is None
            else f"{s['recovery_days']} jours"
        )
        line = (
            f"- {s['scenario_name']}: rendement={s['total_return']:.2%}, "
            f"drawdown max={s['max_drawdown']:.2%}, recovery={recovery}"
        )
        opt_dd = s.get("optimized_drawdown")
        if opt_dd is not None:
            has_comparison = True
            line += f", drawdown portefeuille optimisé={opt_dd:.2%}"
        scenario_lines.append(line)
    scenarios_text = "\n".join(scenario_lines)

    comparison_instruction = ""
    if has_comparison:
        comparison_instruction = (
            "Le graphique montre deux courbes : le portefeuille actuel (rouge) et "
            "le portefeuille optimisé Max Sharpe (bleu pointillé). "
            "Compare les deux et explique pourquoi l'optimisé peut parfois chuter "
            "plus que l'actuel (il est optimisé pour le rendement, pas la résistance aux crises). "
        )

    if mode == "beginner":
        prompt = (
            f"Explique simplement ces résultats de stress test à un investisseur débutant. "
            f"Voici ce qui serait arrivé au portefeuille pendant les crises passées :\n"
            f"{scenarios_text}\n"
            f"{comparison_instruction}"
            f"Utilise des comparaisons simples pour expliquer l'impact. {_suffix(locale)}"
        )
    else:
        prompt = (
            f"Analyse les résultats de ces stress tests historiques :\n"
            f"{scenarios_text}\n"
            f"{comparison_instruction}"
            f"Compare la résilience du portefeuille à travers les différents régimes "
            f"de marché. Commente les drawdowns et temps de recovery. {_suffix(locale)}"
        )

    return await _call_mistral(prompt)
