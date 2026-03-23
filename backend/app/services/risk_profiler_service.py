"""
Risk Profiler Express — Mistral AI service.

Generates a personalized risk profile and suggested portfolio allocation
based on user questionnaire answers.

Model: mistral-small-latest
Max tokens: 800
Temperature: 0.3

Depends on: mistralai, app.core.config
Used by: api/v1/profile.py
"""

import json
import logging
import re

from mistralai.client import Mistral

from app.core.config import settings

logger = logging.getLogger(__name__)

_MODEL = "mistral-small-latest"
_MAX_TOKENS = 800
_TEMPERATURE = 0.3


async def generate_risk_profile(
    horizon: str,
    loss_tolerance: str,
    objective: str,
    experience: str,
) -> dict:
    """
    Generate a personalized risk profile using Mistral.

    Args:
        horizon: "court", "moyen", or "long"
        loss_tolerance: "faible", "modere", or "eleve"
        objective: "preservation", "equilibre", or "croissance"
        experience: "debutant", "intermediaire", or "expert"

    Returns:
        Dict with profile_name, profile_description, suggested_tickers, risk_score.
    """
    if not settings.mistral_api_key:
        raise RuntimeError("MISTRAL_API_KEY is not configured")

    prompt = (
        "Tu es un conseiller financier expert. "
        "Un investisseur a répondu à un questionnaire de profilage de risque.\n\n"
        f"Horizon d'investissement : {horizon} terme\n"
        f"Tolérance aux pertes : {loss_tolerance}\n"
        f"Objectif : {objective}\n"
        f"Expérience : {experience}\n\n"
        "Génère un profil de risque personnalisé au format JSON strict suivant :\n"
        "{\n"
        '  "profile_name": "Nom du profil (ex: Investisseur Prudent, Croissance Modérée, etc.)",\n'
        '  "profile_description": "Une phrase décrivant le profil",\n'
        '  "suggested_tickers": [\n'
        '    {"ticker": "AAPL", "weight": 0.20, "reason": "Raison en une phrase"},\n'
        '    {"ticker": "...", "weight": 0.xx, "reason": "..."}\n'
        "  ],\n"
        '  "risk_score": 5\n'
        "}\n\n"
        "Règles :\n"
        "- Suggère entre 3 et 5 actifs avec des tickers réels (actions US, ETF)\n"
        "- Les poids doivent totaliser 1.0\n"
        "- Le risk_score va de 1 (très conservateur) à 10 (très agressif)\n"
        "- Adapte les choix au profil : conservateur → ETF obligataires, défensifs ; "
        "agressif → growth stocks, tech\n"
        "- Réponds UNIQUEMENT avec le JSON, pas de texte avant ou après\n"
        "- Ne laisse aucun placeholder entre crochets\n"
    )

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

        text = response.choices[0].message.content.strip()

        # Extract JSON from response (may have markdown code fences)
        json_match = re.search(r"\{[\s\S]*\}", text)
        if not json_match:
            raise RuntimeError(f"Could not parse JSON from Mistral response: {text[:200]}")

        result = json.loads(json_match.group())

        # Validate required fields
        required = {"profile_name", "profile_description", "suggested_tickers", "risk_score"}
        if not required.issubset(result.keys()):
            raise RuntimeError(f"Missing fields in Mistral response: {required - result.keys()}")

        # Ensure risk_score is in range
        result["risk_score"] = max(1, min(10, int(result["risk_score"])))

        # Normalize weights
        total_weight = sum(t["weight"] for t in result["suggested_tickers"])
        if total_weight > 0:
            for t in result["suggested_tickers"]:
                t["weight"] = round(t["weight"] / total_weight, 4)

        return result

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error("Failed to parse risk profiler response: %s", str(e))
        raise RuntimeError(f"Failed to parse AI response: {str(e)}") from e
    except RuntimeError:
        raise
    except Exception as e:
        logger.error("Risk profiler Mistral call failed: %s", str(e))
        raise RuntimeError(f"Mistral API error: {str(e)}") from e
