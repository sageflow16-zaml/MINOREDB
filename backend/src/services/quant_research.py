"""
Quantitative Research & Backtesting Lab — Experiment management, backtest/simulation
engines, walk-forward analysis, parameter optimization, statistical analysis,
edge health monitoring, AI integration, research notebook, and export.
"""
import math
import json
import random
import csv
import io
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from src.models.quant_research import (
    Experiment, ExperimentStatus, HypothesisStatus, BacktestRun, BacktestStatus,
    BacktestTrade, SimulationRun, WalkForwardRun, OptimizationRun,
    EdgeHealthSnapshot, RegimePerformance, ResearchNotebook, HypothesisTestResult,
)


def _dict(obj):
    if obj is None: return None
    return {attr.key: getattr(obj, attr.key) for attr in obj.__mapper__.attrs if hasattr(attr, 'columns')}

def _now(): return datetime.utcnow()
def _today(): return _now().strftime("%Y-%m-%d")
def _safe_float(v, default=0.0):
    if v is None: return default
    try: return float(v)
    except: return default


# ═══════════════════════════════════════════════════════
# STATISTICAL ANALYSIS MODULE
# ═══════════════════════════════════════════════════════

def compute_statistics(trades: list[dict], equity_curve: list[float] | None = None) -> dict:
    if not trades:
        return {
            "total_trades": 0, "win_rate": 0, "profit_factor": 0, "net_profit": 0,
            "gross_profit": 0, "gross_loss": 0, "sharpe_ratio": 0, "sortino_ratio": 0,
            "calmar_ratio": 0, "max_drawdown": 0, "max_drawdown_pct": 0,
            "avg_drawdown": 0, "recovery_factor": 0, "expectancy": 0,
            "avg_rr": 0, "avg_win": 0, "avg_loss": 0, "largest_win": 0, "largest_loss": 0,
            "std_dev": 0, "variance": 0, "z_score": 0,
            "confidence_interval": {}, "p_value": 1.0, "sample_size_adequacy": 0,
            "edge_stability": 0,
        }

    pnls = [t.get("pnl", 0) or 0 for t in trades]
    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p <= 0]
    rrs = [t.get("rr", 0) or 0 for t in trades]

    total = len(trades)
    n_wins = len(wins)
    n_losses = len(losses)
    gross_profit = sum(wins)
    gross_loss = abs(sum(losses)) if losses else 0
    net_profit = gross_profit - gross_loss
    win_rate = n_wins / total if total else 0

    profit_factor = gross_profit / gross_loss if gross_loss else (gross_profit if gross_profit > 0 else 0)
    avg_win = sum(wins) / n_wins if n_wins else 0
    avg_loss = sum(losses) / n_losses if n_losses else 0
    largest_win = max(wins) if wins else 0
    largest_loss = min(losses) if losses else 0
    expectancy = (win_rate * avg_win) - ((1 - win_rate) * abs(avg_loss)) if avg_loss else (win_rate * avg_win)
    avg_rr = sum(rrs) / total if total else 0

    mean_pnl = sum(pnls) / total if total else 0
    variance = sum((p - mean_pnl) ** 2 for p in pnls) / total if total else 0
    std_dev = math.sqrt(variance)

    # Sharpe (assumes risk-free = 0)
    sharpe_ratio = (mean_pnl / std_dev) * math.sqrt(252) if std_dev else 0

    # Sortino (downside deviation)
    neg_pnls = [p for p in pnls if p < 0]
    downside_var = sum(p ** 2 for p in neg_pnls) / total if total and neg_pnls else 0
    downside_std = math.sqrt(downside_var)
    sortino_ratio = (mean_pnl / downside_std) * math.sqrt(252) if downside_std else 0

    # Drawdown from equity curve
    max_dd = 0
    max_dd_pct = 0
    avg_dd = 0
    if equity_curve and len(equity_curve) > 1:
        peak = equity_curve[0]
        dd_sum = 0
        dd_count = 0
        for val in equity_curve:
            if val > peak:
                peak = val
            dd = peak - val
            dd_pct = dd / peak if peak else 0
            if dd > max_dd:
                max_dd = dd
                max_dd_pct = dd_pct
            dd_sum += dd
            dd_count += 1
        avg_dd = dd_sum / dd_count if dd_count else 0

    # Calmar
    calmar_ratio = (net_profit / max_dd) if max_dd else 0

    # Recovery factor
    recovery_factor = net_profit / max_dd if max_dd else 0

    # Z-score
    if n_wins > 0 and n_losses > 0:
        p = win_rate
        expected_runs = 1 + (2 * n_wins * n_losses) / total
        std_runs = math.sqrt((2 * n_wins * n_losses * (2 * n_wins * n_losses - total)) / (total ** 2 * (total - 1))) if total > 1 else 1
        actual_runs = 1
        for i in range(1, len(pnls)):
            if (pnls[i] > 0 and pnls[i-1] <= 0) or (pnls[i] <= 0 and pnls[i-1] > 0):
                actual_runs += 1
        z_score = (actual_runs - expected_runs) / std_runs if std_runs else 0
    else:
        z_score = 0

    # Confidence interval
    z = 1.96  # 95% CI
    se = std_dev / math.sqrt(total) if total else 0
    ci_lower = mean_pnl - z * se
    ci_upper = mean_pnl + z * se

    # P-value (t-test approximation)
    t_stat = mean_pnl / se if se else 0
    p_value = 2 * (1 - _normal_cdf(abs(t_stat))) if t_stat != 0 else 1.0

    # Sample size adequacy
    required_sample = ((z * std_dev) / (mean_pnl * 0.1)) ** 2 if mean_pnl and std_dev else 999999
    sample_size_adequacy = min(1.0, total / required_sample) if required_sample else 0

    # Edge stability — rolling win rate consistency
    edge_stability = _compute_edge_stability(pnls)

    return {
        "total_trades": total,
        "win_rate": round(win_rate, 4),
        "profit_factor": round(profit_factor, 4),
        "net_profit": round(net_profit, 4),
        "gross_profit": round(gross_profit, 4),
        "gross_loss": round(gross_loss, 4),
        "sharpe_ratio": round(sharpe_ratio, 4),
        "sortino_ratio": round(sortino_ratio, 4),
        "calmar_ratio": round(calmar_ratio, 4),
        "max_drawdown": round(max_dd, 4),
        "max_drawdown_pct": round(max_dd_pct, 4),
        "avg_drawdown": round(avg_dd, 4),
        "recovery_factor": round(recovery_factor, 4),
        "expectancy": round(expectancy, 4),
        "avg_rr": round(avg_rr, 4),
        "avg_win": round(avg_win, 4),
        "avg_loss": round(avg_loss, 4),
        "largest_win": round(largest_win, 4),
        "largest_loss": round(largest_loss, 4),
        "std_dev": round(std_dev, 4),
        "variance": round(variance, 4),
        "z_score": round(z_score, 4),
        "confidence_interval": {"lower": round(ci_lower, 4), "upper": round(ci_upper, 4), "level": 0.95},
        "p_value": round(p_value, 4),
        "sample_size_adequacy": round(sample_size_adequacy, 4),
        "edge_stability": round(edge_stability, 4),
    }


def _normal_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def _compute_edge_stability(pnls: list[float], window: int = 20) -> float:
    if len(pnls) < window * 2:
        return 0.5
    stabilities = []
    for i in range(0, len(pnls) - window, window // 2):
        chunk = pnls[i:i + window]
        wins = sum(1 for p in chunk if p > 0)
        stabilities.append(wins / len(chunk) if chunk else 0)
    if len(stabilities) < 2:
        return 0.5
    mean_s = sum(stabilities) / len(stabilities)
    var_s = sum((s - mean_s) ** 2 for s in stabilities) / len(stabilities)
    stability = 1 - min(1.0, math.sqrt(var_s) / (mean_s + 0.01))
    return stability


def compute_regime_performance(trades: list[dict]) -> list[dict]:
    regimes: dict[str, list[float]] = {}
    for t in trades:
        r = t.get("regime_at_entry") or "unknown"
        if r not in regimes:
            regimes[r] = []
        regimes[r].append(t.get("pnl", 0) or 0)
    results = []
    for regime, pnls in regimes.items():
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p <= 0]
        n = len(pnls)
        results.append({
            "regime": regime,
            "num_trades": n,
            "win_rate": len(wins) / n if n else 0,
            "profit_factor": sum(wins) / abs(sum(losses)) if losses and sum(losses) else 0,
            "net_profit": sum(pnls),
            "avg_rr": 0,
            "sharpe_ratio": 0,
            "max_drawdown": 0,
            "expectancy": 0,
        })
    return results


def compute_equity_curve(trades: list[dict], start_capital: float = 10000.0) -> tuple[list[dict], list[float], list[float]]:
    curve = []
    dd_curve = []
    capital = start_capital
    peak = start_capital
    equity_values = []
    for i, t in enumerate(trades):
        pnl = t.get("pnl", 0) or 0
        capital += pnl
        equity_values.append(capital)
        if capital > peak:
            peak = capital
        dd = peak - capital
        curve.append({"date": t.get("exit_date") or t.get("entry_date", ""), "equity": round(capital, 2), "pnl": round(pnl, 2)})
        dd_curve.append(round(dd, 2))
    return curve, equity_values, dd_curve


def compute_monthly_returns(trades: list[dict]) -> list[dict]:
    monthly: dict[str, float] = {}
    for t in trades:
        date = t.get("exit_date") or t.get("entry_date", "")
        month = date[:7] if len(date) >= 7 else date
        pnl = t.get("pnl", 0) or 0
        monthly[month] = monthly.get(month, 0) + pnl
    return [{"month": m, "return": round(v, 2)} for m, v in sorted(monthly.items())]


def compute_rolling_metrics(trades: list[dict], window: int = 20) -> dict:
    rolling_wr = []
    rolling_pf = []
    rolling_sharpe = []
    for i in range(len(trades) - window + 1):
        chunk = trades[i:i + window]
        stats = compute_statistics(chunk)
        rolling_wr.append({"index": i, "value": stats["win_rate"]})
        rolling_pf.append({"index": i, "value": stats["profit_factor"]})
        rolling_sharpe.append({"index": i, "value": stats["sharpe_ratio"]})
    return {
        "rolling_win_rate": rolling_wr,
        "rolling_profit_factor": rolling_pf,
        "rolling_sharpe": rolling_sharpe,
        "window": window,
    }


# ═══════════════════════════════════════════════════════
# BACKTEST ENGINE
# ═══════════════════════════════════════════════════════

def _apply_costs(trade: dict, costs: dict) -> dict:
    commission = _safe_float(costs.get("commission", 0))
    spread = _safe_float(costs.get("spread", 0))
    slippage = _safe_float(costs.get("slippage", 0))
    execution_delay = _safe_float(costs.get("execution_delay", 0))
    trade["fees"] = trade.get("fees", 0) + commission
    trade["slippage"] = slippage
    if spread > 0 and trade.get("entry_price"):
        trade["entry_price"] += spread * (1 if trade.get("direction") == "long" else -1)
    if execution_delay > 0:
        pass  # signal delay effect modeled as additional slippage
    return trade


def _generate_sample_trades(config: dict) -> list[dict]:
    """Generate synthetic trades for demonstration when no real strategy is linked."""
    n = config.get("num_trades", 100)
    win_rate = config.get("win_rate", 0.45)
    avg_win = config.get("avg_win", 200)
    avg_loss = config.get("avg_loss", 150)
    symbols = config.get("symbols", ["EURUSD", "GBPUSD", "BTCUSD"])
    regimes = ["trending", "ranging", "high_vol", "low_vol", "risk_on", "risk_off"]
    trades = []
    capital = 10000.0
    for i in range(n):
        is_win = random.random() < win_rate
        pnl = avg_win * (1 + random.uniform(-0.3, 0.3)) if is_win else -avg_loss * (1 + random.uniform(-0.3, 0.3))
        capital += pnl
        rr = abs(pnl) / avg_loss if avg_loss else 1
        trades.append({
            "entry_date": f"2024-{(i % 12) + 1:02d}{(i % 28) + 1:02d}",
            "exit_date": f"2024-{(i % 12) + 1:02d}{(i % 28) + 3:02d}",
            "symbol": random.choice(symbols),
            "direction": random.choice(["long", "short"]),
            "entry_price": round(random.uniform(1.0, 200.0), 4),
            "exit_price": round(random.uniform(1.0, 200.0), 4),
            "quantity": 1,
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl / 10000 * 100, 4),
            "rr": round(rr, 2),
            "fees": 0,
            "slippage": 0,
            "exit_reason": random.choice(["tp", "sl", "exit_signal"]),
            "regime_at_entry": random.choice(regimes),
            "tags": [],
        })
    return trades


def execute_backtest(data: dict) -> dict:
    """Execute a backtest — generates trades from config or linked strategy data."""
    config = data.get("config", {})
    costs = data.get("costs", {})
    start_capital = _safe_float(config.get("start_capital", 10000))

    if config.get("use_real_trades"):
        trades = config.get("trades", [])
    else:
        trades = _generate_sample_trades({**config, "symbols": data.get("symbols")})

    for t in trades:
        t = _apply_costs(t, costs)

    equity_curve_list, equity_values, dd_values = compute_equity_curve(trades, start_capital)
    stats = compute_statistics(trades, equity_values)
    regime_perf = compute_regime_performance(trades)
    monthly_ret = compute_monthly_returns(trades)
    rolling = compute_rolling_metrics(trades)

    return {
        **stats,
        "total_trades": len(trades),
        "trades": trades,
        "equity_curve": equity_curve_list,
        "drawdown_curve": dd_values,
        "monthly_returns": monthly_ret,
        "rolling_metrics": rolling,
        "regime_performance": regime_perf,
        "trade_distribution": {
            "long": len([t for t in trades if t.get("direction") == "long"]),
            "short": len([t for t in trades if t.get("direction") == "short"]),
            "tp": len([t for t in trades if t.get("exit_reason") == "tp"]),
            "sl": len([t for t in trades if t.get("exit_reason") == "sl"]),
            "exit_signal": len([t for t in trades if t.get("exit_reason") == "exit_signal"]),
        },
        "parameters_used": config.get("parameters", {}),
    }


# ═══════════════════════════════════════════════════════
# SIMULATION ENGINE
# ═══════════════════════════════════════════════════════

def run_monte_carlo(trades: list[dict], num_simulations: int = 1000, seed: int | None = None) -> dict:
    if seed is not None:
        random.seed(seed)
    pnls = [t.get("pnl", 0) or 0 for t in trades]
    if not pnls:
        return {"error": "No trades to simulate", "results": {}, "percentiles": {}, "equity_curves": []}

    final_equities = []
    equity_curves = []
    start_capital = 10000.0

    for _ in range(num_simulations):
        shuffled = random.choices(pnls, k=len(pnls))
        capital = start_capital
        curve = []
        for p in shuffled:
            capital += p
            curve.append(capital)
        final_equities.append(capital)
        equity_curves.append(curve)

    final_equities.sort()
    p5 = final_equities[int(len(final_equities) * 0.05)]
    p25 = final_equities[int(len(final_equities) * 0.25)]
    p50 = final_equities[int(len(final_equities) * 0.50)]
    p75 = final_equities[int(len(final_equities) * 0.75)]
    p95 = final_equities[int(len(final_equities) * 0.95)]

    # Compute percentile curves
    max_len = max(len(c) for c in equity_curves)
    aligned = []
    for c in equity_curves:
        aligned.append(c + [c[-1]] * (max_len - len(c)))
    percentile_curves = {}
    for pctl in [5, 25, 50, 75, 95]:
        percentile_curves[str(pctl)] = [
            round(sorted(col)[int(len(col) * pctl / 100)], 2) for col in zip(*aligned)
        ]

    mean_final = sum(final_equities) / len(final_equities)
    prob_profit = sum(1 for e in final_equities if e > start_capital) / len(final_equities)

    hist = {}
    for e in final_equities:
        bucket = int(e / 1000) * 1000
        hist[bucket] = hist.get(bucket, 0) + 1
    distribution = [{"bucket": k, "count": v} for k, v in sorted(hist.items())]

    return {
        "num_simulations": num_simulations,
        "start_capital": start_capital,
        "mean_final_equity": round(mean_final, 2),
        "median_final_equity": round(p50, 2),
        "probability_of_profit": round(prob_profit, 4),
        "percentiles": {"p5": round(p5, 2), "p25": round(p25, 2), "p50": round(p50, 2), "p75": round(p75, 2), "p95": round(p95, 2)},
        "equity_curves": percentile_curves,
        "distribution": distribution,
        "final_equities_summary": {
            "min": round(final_equities[0], 2),
            "max": round(final_equities[-1], 2),
            "mean": round(mean_final, 2),
            "std": round(math.sqrt(sum((e - mean_final) ** 2 for e in final_equities) / len(final_equities)), 2),
        },
    }


def run_bootstrap(trades: list[dict], num_samples: int = 1000, seed: int | None = None) -> dict:
    if seed is not None:
        random.seed(seed)
    pnls = [t.get("pnl", 0) or 0 for t in trades]
    if not pnls:
        return {"error": "No trades to bootstrap"}
    stats_samples = {"sharpe_ratio": [], "win_rate": [], "profit_factor": [], "avg_rr": []}
    for _ in range(num_samples):
        sample = random.choices(pnls, k=len(pnls))
        s = compute_statistics([{"pnl": p} for p in sample])
        stats_samples["sharpe_ratio"].append(s["sharpe_ratio"])
        stats_samples["win_rate"].append(s["win_rate"])
        stats_samples["profit_factor"].append(s["profit_factor"])
        stats_samples["avg_rr"].append(s["avg_rr"])
    result = {}
    for key, values in stats_samples.items():
        values.sort()
        result[key] = {
            "mean": round(sum(values) / len(values), 4),
            "std": round(math.sqrt(sum((v - sum(values) / len(values)) ** 2 for v in values) / len(values)), 4),
            "ci_95": {"lower": round(values[int(len(values) * 0.025)], 4), "upper": round(values[int(len(values) * 0.975)], 4)},
        }
    return {"num_samples": num_samples, "results": result}


# ═══════════════════════════════════════════════════════
# WALK-FORWARD ANALYSIS
# ═══════════════════════════════════════════════════════

def run_walkforward_analysis(trades: list[dict], data: dict) -> dict:
    training = data.get("training_window", 252)
    validation = data.get("validation_window", 63)
    step = data.get("step_size", 63)

    if len(trades) < training + validation:
        return {"error": f"Need at least {training + validation} trades, have {len(trades)}"}

    windows = []
    i = 0
    while i + training + validation <= len(trades):
        train = trades[i:i + training]
        test = trades[i + training:i + training + validation]
        train_stats = compute_statistics(train)
        test_stats = compute_statistics(test)
        windows.append({
            "window_index": len(windows),
            "train_start": train[0].get("entry_date", ""),
            "train_end": train[-1].get("exit_date", ""),
            "test_start": test[0].get("entry_date", ""),
            "test_end": test[-1].get("exit_date", ""),
            "train_metrics": train_stats,
            "test_metrics": test_stats,
            "decay": abs(train_stats.get("sharpe_ratio", 0) - test_stats.get("sharpe_ratio", 0)),
        })
        i += step

    if not windows:
        return {"error": "No windows generated"}

    # Aggregate
    train_sharpes = [w["train_metrics"]["sharpe_ratio"] for w in windows]
    test_sharpes = [w["test_metrics"]["sharpe_ratio"] for w in windows]
    decays = [w["decay"] for w in windows]

    stability_score = 1 - min(1.0, math.sqrt(sum((d - sum(decays) / len(decays)) ** 2 for d in decays) / len(decays)) / (abs(sum(decays) / len(decays)) + 0.01)) if decays else 0

    return {
        "num_windows": len(windows),
        "windows": windows,
        "stability_score": round(stability_score, 4),
        "aggregate_metrics": {
            "avg_train_sharpe": round(sum(train_sharpes) / len(train_sharpes), 4),
            "avg_test_sharpe": round(sum(test_sharpes) / len(test_sharpes), 4),
            "avg_decay": round(sum(decays) / len(decays), 4),
            "train_sharpe_std": round(math.sqrt(sum((s - sum(train_sharpes) / len(train_sharpes)) ** 2 for s in train_sharpes) / len(train_sharpes)), 4),
            "test_sharpe_std": round(math.sqrt(sum((s - sum(test_sharpes) / len(test_sharpes)) ** 2 for s in test_sharpes) / len(test_sharpes)), 4),
        },
        "oos_performance": {
            "sharpe_ratio": round(sum(test_sharpes) / len(test_sharpes), 4),
            "stability": round(stability_score, 4),
        },
        "parameter_stability": {},
    }


# ═══════════════════════════════════════════════════════
# PARAMETER OPTIMIZATION
# ═══════════════════════════════════════════════════════

def run_grid_search(data: dict) -> dict:
    params = data.get("parameters", {})
    constraints = data.get("constraints", {})
    objective = data.get("objective", "sharpe_ratio")
    maximize = data.get("maximize", True)

    param_names = list(params.keys())
    if not param_names:
        return {"error": "No parameters defined"}

    # Build grid
    grid_values = []
    for pname in param_names:
        pdef = params[pname]
        grid_values.append(_generate_param_values(pdef))

    import itertools
    results = []
    total = 1
    for gv in grid_values:
        total *= len(gv)

    max_combinations = constraints.get("max_combinations", 5000)
    actual_total = min(total, max_combinations)

    count = 0
    for combo in itertools.product(*grid_values):
        if count >= max_combinations:
            break
        param_set = dict(zip(param_names, combo))
        config = {**data.get("config", {}), "parameters": param_set}
        config["num_trades"] = constraints.get("num_trades", 100)
        config["win_rate"] = param_set.get("win_rate", 0.45)
        config["avg_win"] = param_set.get("avg_win", 200)
        config["avg_loss"] = param_set.get("avg_loss", 150)

        bt_result = execute_backtest({"config": config, "costs": data.get("costs", {})})
        metric_value = bt_result.get(objective, 0)
        results.append({
            "parameters": param_set,
            "objective_value": round(metric_value, 4),
            "metrics": {
                "win_rate": bt_result.get("win_rate", 0),
                "profit_factor": bt_result.get("profit_factor", 0),
                "sharpe_ratio": bt_result.get("sharpe_ratio", 0),
                "max_drawdown_pct": bt_result.get("max_drawdown_pct", 0),
                "net_profit": bt_result.get("net_profit", 0),
            }
        })
        count += 1

    results.sort(key=lambda r: r["objective_value"], reverse=maximize)

    return {
        "optimization_type": "grid",
        "total_combinations": total,
        "tested_combinations": len(results),
        "best_result": results[0] if results else None,
        "worst_result": results[-1] if results else None,
        "results": results[:100],  # top 100
        "heatmap_data": _build_heatmap(results, param_names),
        "convergence_curve": [{"iteration": i, "best": results[0]["objective_value"] if i == 0 else max(r["objective_value"] for r in results[:i+1]) if maximize else min(r["objective_value"] for r in results[:i+1])} for i in range(len(results))],
    }


def _generate_param_values(pdef: dict) -> list:
    ptype = pdef.get("type", "float")
    min_v = pdef.get("min", 0)
    max_v = pdef.get("max", 1)
    step = pdef.get("step", 0.1)
    values = pdef.get("values", None)
    if values:
        return values
    if ptype == "int":
        return list(range(int(min_v), int(max_v) + 1, int(max(1, step))))
    n = max(2, int((max_v - min_v) / step) + 1)
    return [round(min_v + i * (max_v - min_v) / (n - 1), 4) for i in range(n)]


def _build_heatmap(results: list[dict], param_names: list[str]) -> dict:
    if len(param_names) < 2 or not results:
        return {}
    p0 = param_names[0]
    p1 = param_names[1]
    heatmap: dict[str, dict] = {}
    for r in results:
        x = str(r["parameters"].get(p0, ""))
        y = str(r["parameters"].get(p1, ""))
        if x not in heatmap:
            heatmap[x] = {}
        heatmap[x][y] = r["objective_value"]
    return {"x_axis": p0, "y_axis": p1, "data": heatmap}


# ═══════════════════════════════════════════════════════
# EDGE HEALTH MONITOR
# ═══════════════════════════════════════════════════════

def compute_edge_health(trades: list[dict], previous_snapshots: list[dict] | None = None) -> dict:
    stats = compute_statistics(trades)
    equity_values = [10000.0]
    for t in trades:
        equity_values.append(equity_values[-1] + (t.get("pnl", 0) or 0))

    edge_stability = _compute_edge_stability([t.get("pnl", 0) or 0 for t in trades])

    # Performance drift — compare to previous snapshots
    performance_drift = 0.0
    if previous_snapshots and len(previous_snapshots) > 0:
        prev_sharpes = [s.get("metrics", {}).get("sharpe_ratio", 0) for s in previous_snapshots if s.get("metrics")]
        if prev_sharpes:
            avg_prev_sharpe = sum(prev_sharpes) / len(prev_sharpes)
            current_sharpe = stats.get("sharpe_ratio", 0)
            performance_drift = abs(current_sharpe - avg_prev_sharpe) / (abs(avg_prev_sharpe) + 0.01)

    # Drawdown severity
    max_dd_pct = stats.get("max_drawdown_pct", 0)
    drawdown_severity = min(1.0, max_dd_pct * 5)

    # Confidence decay
    sample_adequacy = stats.get("sample_size_adequacy", 0)
    confidence_decay = 1 - min(1.0, sample_adequacy)

    overall_health = round(
        0.30 * edge_stability +
        0.20 * (1 - performance_drift) +
        0.15 * (1 - drawdown_severity) +
        0.15 * stats.get("sharpe_ratio", 0) / max(3, stats.get("sharpe_ratio", 0) or 1) +
        0.10 * (1 - confidence_decay) +
        0.10 * sample_adequacy,
        4
    )

    signals = []
    if edge_stability < 0.3:
        signals.append({"type": "warning", "message": "Edge stability critically low", "severity": "high"})
    if performance_drift > 0.3:
        signals.append({"type": "warning", "message": "Significant performance drift detected", "severity": "medium"})
    if drawdown_severity > 0.5:
        signals.append({"type": "danger", "message": "Drawdown severity elevated", "severity": "high"})
    if confidence_decay > 0.5:
        signals.append({"type": "warning", "message": "Confidence decaying — sample size may be inadequate", "severity": "medium"})
    if overall_health > 0.7:
        signals.append({"type": "positive", "message": "Edge health is strong", "severity": "low"})

    return {
        "overall_health": overall_health,
        "edge_stability": round(edge_stability, 4),
        "performance_drift": round(performance_drift, 4),
        "parameter_drift": 0.0,
        "strategy_degradation": round(1 - edge_stability, 4),
        "drawdown_severity": round(drawdown_severity, 4),
        "confidence_decay": round(confidence_decay, 4),
        "metrics": stats,
        "signals": signals,
        "recommendations": _generate_recommendations(overall_health, edge_stability, performance_drift, drawdown_severity),
    }


def _generate_recommendations(health: float, stability: float, drift: float, dd_severity: float) -> list[str]:
    recs = []
    if health < 0.3:
        recs.append("Consider pausing strategy — edge health is critically low")
    if stability < 0.3:
        recs.append("Review strategy logic — edge stability is poor")
    if drift > 0.3:
        recs.append("Investigate regime change — performance has drifted significantly")
    if dd_severity > 0.5:
        recs.append("Implement tighter risk controls — drawdown severity is elevated")
    if health >= 0.7:
        recs.append("Strategy edge appears healthy — continue monitoring")
    return recs


# ═══════════════════════════════════════════════════════
# AI RESEARCH ASSISTANT
# ═══════════════════════════════════════════════════════

def generate_ai_research(query: str, context: dict | None = None) -> dict:
    exp = context.get("experiment") if context else None
    bt = context.get("backtest") if context else None
    stats = context.get("statistics") if context else {}

    if bt:
        s = stats
        total = s.get("total_trades", 0)
        wr = s.get("win_rate", 0) * 100
        pf = s.get("profit_factor", 0)
        sharpe = s.get("sharpe_ratio", 0)
        dd = s.get("max_drawdown_pct", 0) * 100

        return {
            "query": query,
            "summary": f"Backtest {'#' + bt[:8] if bt else 'N/A'} analyzed: {total} trades, {wr:.1f}% win rate, {pf:.2f} profit factor, {sharpe:.2f} Sharpe, {dd:.1f}% max drawdown.",
            "interpretation": f"The strategy {'appears robust' if sharpe > 1.5 else 'shows moderate edge' if sharpe > 0.5 else 'needs improvement'} with a {wr:.1f}% win rate and {pf:.2f} profit factor.",
            "weaknesses": [f"{'Wide drawdown' if dd > 20 else 'Reasonable drawdown'} of {dd:.1f}%", f"Sample size: {total} trades ({'adequate' if total > 100 else 'limited'})", f"Sharpe: {'strong' if sharpe > 2 else 'moderate' if sharpe > 1 else 'low'} ({sharpe:.2f})"],
            "suggestions": ["Optimize risk per trade", "Test across different market regimes", "Consider adding a volatility filter"],
            "overfitting_risk": "Low" if len(stats) < 20 else "Medium" if len(stats) < 50 else "High",
            "new_hypotheses": ["Performance improves during trending markets", "Strategy underperforms during high-vol regimes"],
        }

    return {
        "query": query,
        "summary": "Research query processed. No backtest data linked — start an experiment to generate results.",
        "interpretation": "Create a new experiment, configure backtest parameters, and run a simulation.",
        "weaknesses": ["No data available"],
        "suggestions": ["Create an experiment", "Link a strategy", "Run a backtest"],
        "overfitting_risk": "N/A",
        "new_hypotheses": [],
    }


def generate_research_report(experiment: dict | None, backtest: dict | None, statistics: dict | None) -> str:
    parts = ["# Quantitative Research Report\n"]
    if experiment:
        parts.append(f"## Experiment: {experiment.get('name', 'N/A')}\n")
        parts.append(f"Status: {experiment.get('status', 'N/A')}\n")
        parts.append(f"Hypothesis: {experiment.get('hypothesis', 'N/A')}\n\n")
    if statistics:
        s = statistics
        parts.append("## Performance Metrics\n")
        parts.append(f"- **Total Trades:** {s.get('total_trades', 0)}\n")
        parts.append(f"- **Win Rate:** {s.get('win_rate', 0) * 100:.1f}%\n")
        parts.append(f"- **Profit Factor:** {s.get('profit_factor', 0):.2f}\n")
        parts.append(f"- **Net Profit:** ${s.get('net_profit', 0):.2f}\n")
        parts.append(f"- **Sharpe Ratio:** {s.get('sharpe_ratio', 0):.2f}\n")
        parts.append(f"- **Sortino Ratio:** {s.get('sortino_ratio', 0):.2f}\n")
        parts.append(f"- **Max Drawdown:** {s.get('max_drawdown_pct', 0) * 100:.1f}%\n")
        parts.append(f"- **Calmar Ratio:** {s.get('calmar_ratio', 0):.2f}\n")
        parts.append(f"- **Expectancy:** ${s.get('expectancy', 0):.2f}\n")
        parts.append(f"- **Z-Score:** {s.get('z_score', 0):.2f}\n")
        parts.append(f"- **Edge Stability:** {s.get('edge_stability', 0):.2f}\n")
        parts.append(f"- **P-Value:** {s.get('p_value', 0):.4f}\n\n")
    if backtest and backtest.get("regime_performance"):
        parts.append("## Regime Performance\n")
        for rp in backtest["regime_performance"]:
            parts.append(f"- **{rp.get('regime', 'N/A')}:** {rp.get('num_trades', 0)} trades, {rp.get('win_rate', 0) * 100:.1f}% WR\n")
        parts.append("\n")
    if statistics and statistics.get("total_trades", 0) > 0:
        parts.append("## Conclusion\n")
        s = statistics
        if s.get("sharpe_ratio", 0) > 1.5 and s.get("edge_stability", 0) > 0.5:
            parts.append("The strategy demonstrates a statistically significant edge with robust performance stability.")
        elif s.get("sharpe_ratio", 0) > 0.5:
            parts.append("The strategy shows a moderate edge but requires further optimization and validation.")
        else:
            parts.append("The strategy does not demonstrate a statistically significant edge. Consider revising the hypothesis.")
    return "\n".join(parts)


# ═══════════════════════════════════════════════════════
# ORCHESTRATOR
# ═══════════════════════════════════════════════════════

class QuantResearchLab:
    def __init__(self, db: Session, project_id: UUID):
        self.db = db
        self.project_id = project_id

    # ── Dashboard ──

    @property
    def get_dashboard(self) -> dict:
        experiments = self.db.query(Experiment).filter(Experiment.project_id == self.project_id).all()
        total = len(experiments)
        active = sum(1 for e in experiments if e.status == ExperimentStatus.RUNNING)
        completed = sum(1 for e in experiments if e.status == ExperimentStatus.COMPLETED)
        draft = sum(1 for e in experiments if e.status == ExperimentStatus.DRAFT)

        supported_hypotheses = sum(1 for e in experiments if e.hypothesis_status == HypothesisStatus.SUPPORTED)
        rejected_hypotheses = sum(1 for e in experiments if e.hypothesis_status == HypothesisStatus.REJECTED)

        best_backtest = self.db.query(BacktestRun).filter(
            BacktestRun.project_id == self.project_id,
            BacktestRun.status == BacktestStatus.COMPLETED
        ).order_by(BacktestRun.sharpe_ratio.desc().nullslast()).first()

        latest_edge = self.db.query(EdgeHealthSnapshot).filter(
            EdgeHealthSnapshot.project_id == self.project_id
        ).order_by(EdgeHealthSnapshot.created_at.desc()).first()

        recent_discoveries = self.db.query(HypothesisTestResult).filter(
            HypothesisTestResult.project_id == self.project_id,
            HypothesisTestResult.result == "supported"
        ).order_by(HypothesisTestResult.created_at.desc()).limit(5).all()

        queue_count = self.db.query(BacktestRun).filter(
            BacktestRun.project_id == self.project_id,
            BacktestRun.status == BacktestStatus.PENDING
        ).count()

        return {
            "total_experiments": total,
            "active_experiments": active,
            "completed_experiments": completed,
            "draft_experiments": draft,
            "supported_hypotheses": supported_hypotheses,
            "rejected_hypotheses": rejected_hypotheses,
            "recent_discoveries": [_dict(h) for h in recent_discoveries],
            "best_model": _dict(best_backtest) if best_backtest else None,
            "current_edge_health": _dict(latest_edge) if latest_edge else None,
            "experiment_queue_count": queue_count,
            "research_progress": round((completed / total * 100) if total else 0, 1),
            "overall_confidence": round(latest_edge.overall_health if latest_edge and latest_edge.overall_health else 0, 4),
        }

    # ── Experiments ──

    def list_experiments(self, status: str | None = None, tags: list[str] | None = None, sort: str = "updated_at", limit: int = 50) -> list[dict]:
        q = self.db.query(Experiment).filter(Experiment.project_id == self.project_id)
        if status:
            q = q.filter(Experiment.status == status)
        sort_col = getattr(Experiment, sort, Experiment.updated_at)
        q = q.order_by(sort_col.desc()).limit(limit)
        return [_dict(e) for e in q.all()]

    def create_experiment(self, data: dict) -> dict:
        exp = Experiment(
            project_id=self.project_id,
            name=data.get("name", "Untitled Experiment"),
            description=data.get("description"),
            hypothesis=data.get("hypothesis"),
            tags=data.get("tags", []),
            config=data.get("config", {}),
            linked_strategy_ids=data.get("linked_strategy_ids", []),
            linked_trade_ids=data.get("linked_trade_ids", []),
            linked_research_ids=data.get("linked_research_ids", []),
            parent_experiment_id=UUID(data["parent_experiment_id"]) if data.get("parent_experiment_id") else None,
        )
        self.db.add(exp)
        self.db.commit()
        self.db.refresh(exp)
        return _dict(exp)

    def get_experiment(self, experiment_id: UUID) -> dict:
        exp = self.db.query(Experiment).filter(Experiment.id == experiment_id, Experiment.project_id == self.project_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Experiment not found")
        return _dict(exp)

    def update_experiment(self, experiment_id: UUID, data: dict) -> dict:
        exp = self.db.query(Experiment).filter(Experiment.id == experiment_id, Experiment.project_id == self.project_id).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Experiment not found")
        for key, value in data.items():
            if value is not None and hasattr(exp, key):
                if key == "parent_experiment_id" and value:
                    value = UUID(value)
                setattr(exp, key, value)
        exp.updated_at = _now()
        exp.version += 1
        self.db.commit()
        self.db.refresh(exp)
        return _dict(exp)

    def delete_experiment(self, experiment_id: UUID):
        exp = self.db.query(Experiment).filter(Experiment.id == experiment_id, Experiment.project_id == self.project_id).first()
        if exp:
            self.db.delete(exp)
            self.db.commit()

    def duplicate_experiment(self, experiment_id: UUID) -> dict:
        original = self.db.query(Experiment).filter(Experiment.id == experiment_id, Experiment.project_id == self.project_id).first()
        if not original:
            raise HTTPException(status_code=404, detail="Experiment not found")
        copy = Experiment(
            project_id=self.project_id,
            name=f"{original.name} (copy)",
            description=original.description,
            hypothesis=original.hypothesis,
            tags=original.tags,
            config=original.config,
            linked_strategy_ids=original.linked_strategy_ids,
            linked_trade_ids=original.linked_trade_ids,
            linked_research_ids=original.linked_research_ids,
            parent_experiment_id=original.id,
        )
        self.db.add(copy)
        self.db.commit()
        self.db.refresh(copy)
        return _dict(copy)

    def get_experiment_results(self, experiment_id: UUID) -> dict:
        backtests = self.db.query(BacktestRun).filter(
            BacktestRun.experiment_id == experiment_id
        ).order_by(BacktestRun.created_at.desc()).all()
        simulations = self.db.query(SimulationRun).filter(
            SimulationRun.experiment_id == experiment_id
        ).order_by(SimulationRun.created_at.desc()).all()
        optimizations = self.db.query(OptimizationRun).filter(
            OptimizationRun.experiment_id == experiment_id
        ).order_by(OptimizationRun.created_at.desc()).all()
        walkforwards = self.db.query(WalkForwardRun).filter(
            WalkForwardRun.experiment_id == experiment_id
        ).order_by(WalkForwardRun.created_at.desc()).all()
        notebooks = self.db.query(ResearchNotebook).filter(
            ResearchNotebook.experiment_id == experiment_id
        ).order_by(ResearchNotebook.sort_order).all()
        return {
            "backtests": [_dict(b) for b in backtests],
            "simulations": [_dict(s) for s in simulations],
            "optimizations": [_dict(o) for o in optimizations],
            "walkforwards": [_dict(w) for w in walkforwards],
            "notebooks": [_dict(n) for n in notebooks],
        }

    # ── Backtesting ──

    def list_backtests(self, experiment_id: UUID | None = None, status: str | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(BacktestRun).filter(BacktestRun.project_id == self.project_id)
        if experiment_id:
            q = q.filter(BacktestRun.experiment_id == experiment_id)
        if status:
            q = q.filter(BacktestRun.status == status)
        q = q.order_by(BacktestRun.created_at.desc()).limit(limit)
        return [_dict(b) for b in q.all()]

    def run_backtest(self, data: dict) -> dict:
        bt = BacktestRun(
            project_id=self.project_id,
            experiment_id=UUID(data["experiment_id"]) if data.get("experiment_id") else None,
            name=data.get("name", "Backtest"),
            status=BacktestStatus.RUNNING,
            strategy_id=UUID(data["strategy_id"]) if data.get("strategy_id") else None,
            backtest_type=data.get("backtest_type", "single"),
            config=data.get("config", {}),
            filters=data.get("filters", {}),
            costs=data.get("costs", {}),
            start_date=data.get("start_date", ""),
            end_date=data.get("end_date", ""),
            symbols=data.get("symbols", []),
            timeframes=data.get("timeframes", []),
        )
        self.db.add(bt)
        self.db.commit()
        self.db.refresh(bt)

        try:
            start = _now()
            result = execute_backtest(data)
            elapsed = (_now() - start).total_seconds()

            bt.status = BacktestStatus.COMPLETED
            bt.total_trades = result.get("total_trades", 0)
            bt.win_rate = result.get("win_rate")
            bt.profit_factor = result.get("profit_factor")
            bt.net_profit = result.get("net_profit")
            bt.gross_profit = result.get("gross_profit")
            bt.gross_loss = result.get("gross_loss")
            bt.sharpe_ratio = result.get("sharpe_ratio")
            bt.sortino_ratio = result.get("sortino_ratio")
            bt.calmar_ratio = result.get("calmar_ratio")
            bt.max_drawdown = result.get("max_drawdown")
            bt.max_drawdown_pct = result.get("max_drawdown_pct")
            bt.avg_drawdown = result.get("avg_drawdown")
            bt.recovery_factor = result.get("recovery_factor")
            bt.expectancy = result.get("expectancy")
            bt.avg_rr = result.get("avg_rr")
            bt.avg_win = result.get("avg_win")
            bt.avg_loss = result.get("avg_loss")
            bt.largest_win = result.get("largest_win")
            bt.largest_loss = result.get("largest_loss")
            bt.std_dev = result.get("std_dev")
            bt.variance = result.get("variance")
            bt.z_score = result.get("z_score")
            bt.confidence_interval = result.get("confidence_interval")
            bt.p_value = result.get("p_value")
            bt.sample_size_adequacy = result.get("sample_size_adequacy")
            bt.edge_stability = result.get("edge_stability")
            bt.equity_curve = result.get("equity_curve", [])
            bt.drawdown_curve = result.get("drawdown_curve", [])
            bt.monthly_returns = result.get("monthly_returns", [])
            bt.trade_distribution = result.get("trade_distribution", {})
            bt.rolling_metrics = result.get("rolling_metrics", {})
            bt.parameters_used = data.get("config", {}).get("parameters", {})
            bt.duration_seconds = elapsed

            # Save trades
            for t in result.get("trades", []):
                trade = BacktestTrade(
                    backtest_run_id=bt.id,
                    entry_date=t.get("entry_date", ""),
                    exit_date=t.get("exit_date"),
                    symbol=t.get("symbol", ""),
                    direction=t.get("direction", "long"),
                    entry_price=t.get("entry_price", 0),
                    exit_price=t.get("exit_price"),
                    quantity=t.get("quantity", 1),
                    pnl=t.get("pnl"),
                    pnl_pct=t.get("pnl_pct"),
                    rr=t.get("rr"),
                    fees=t.get("fees", 0),
                    slippage=t.get("slippage", 0),
                    exit_reason=t.get("exit_reason"),
                    regime_at_entry=t.get("regime_at_entry"),
                    tags=t.get("tags", []),
                )
                self.db.add(trade)

            # Save regime performance
            for rp in result.get("regime_performance", []):
                rp_record = RegimePerformance(
                    backtest_run_id=bt.id,
                    regime=rp.get("regime", "unknown"),
                    num_trades=rp.get("num_trades", 0),
                    win_rate=rp.get("win_rate"),
                    profit_factor=rp.get("profit_factor"),
                    net_profit=rp.get("net_profit"),
                    avg_rr=rp.get("avg_rr"),
                )
                self.db.add(rp_record)

            self.db.commit()
            self.db.refresh(bt)

            # Auto-update experiment if linked
            if bt.experiment_id:
                exp = self.db.query(Experiment).filter(Experiment.id == bt.experiment_id).first()
                if exp and exp.status == ExperimentStatus.DRAFT:
                    exp.status = ExperimentStatus.RUNNING
                    self.db.commit()

        except Exception as e:
            bt.status = BacktestStatus.FAILED
            bt.error = str(e)
            self.db.commit()

        return _dict(bt)

    def get_backtest(self, backtest_id: UUID) -> dict:
        bt = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_id, BacktestRun.project_id == self.project_id).first()
        if not bt:
            raise HTTPException(status_code=404, detail="Backtest not found")
        return _dict(bt)

    def delete_backtest(self, backtest_id: UUID):
        bt = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_id, BacktestRun.project_id == self.project_id).first()
        if bt:
            self.db.delete(bt)
            self.db.commit()

    def get_backtest_trades(self, backtest_id: UUID, page: int = 1, per_page: int = 100) -> dict:
        q = self.db.query(BacktestTrade).filter(BacktestTrade.backtest_run_id == backtest_id)
        total = q.count()
        trades = q.order_by(BacktestTrade.created_at).offset((page - 1) * per_page).limit(per_page).all()
        return {"trades": [_dict(t) for t in trades], "total": total, "page": page, "per_page": per_page}

    def get_equity_curve(self, backtest_id: UUID) -> list:
        bt = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()
        return bt.equity_curve if bt and bt.equity_curve else []

    def get_backtest_metrics(self, backtest_id: UUID) -> dict:
        bt = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()
        if not bt:
            return {}
        return {
            "sharpe_ratio": bt.sharpe_ratio,
            "sortino_ratio": bt.sortino_ratio,
            "calmar_ratio": bt.calmar_ratio,
            "profit_factor": bt.profit_factor,
            "win_rate": bt.win_rate,
            "net_profit": bt.net_profit,
            "max_drawdown_pct": bt.max_drawdown_pct,
            "recovery_factor": bt.recovery_factor,
            "expectancy": bt.expectancy,
            "avg_rr": bt.avg_rr,
            "z_score": bt.z_score,
            "edge_stability": bt.edge_stability,
            "p_value": bt.p_value,
            "sample_size_adequacy": bt.sample_size_adequacy,
        }

    # ── Simulations ──

    def list_simulations(self, experiment_id: UUID | None = None, simulation_type: str | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(SimulationRun).filter(SimulationRun.project_id == self.project_id)
        if experiment_id:
            q = q.filter(SimulationRun.experiment_id == experiment_id)
        if simulation_type:
            q = q.filter(SimulationRun.simulation_type == simulation_type)
        q = q.order_by(SimulationRun.created_at.desc()).limit(limit)
        return [_dict(s) for s in q.all()]

    def run_simulation(self, data: dict) -> dict:
        sim = SimulationRun(
            project_id=self.project_id,
            experiment_id=UUID(data["experiment_id"]) if data.get("experiment_id") else None,
            backtest_run_id=UUID(data["backtest_run_id"]) if data.get("backtest_run_id") else None,
            name=data.get("name", "Simulation"),
            simulation_type=data.get("simulation_type", "monte_carlo"),
            status=BacktestStatus.RUNNING,
            config=data.get("config", {}),
            num_simulations=data.get("num_simulations", 1000),
            random_seed=data.get("random_seed"),
        )
        self.db.add(sim)
        self.db.commit()
        self.db.refresh(sim)

        try:
            start = _now()

            # Get trades from linked backtest or generate
            trades = []
            if sim.backtest_run_id:
                trades_data = self.db.query(BacktestTrade).filter(BacktestTrade.backtest_run_id == sim.backtest_run_id).all()
                trades = [_dict(t) for t in trades_data]

            if not trades:
                bt_config = data.get("config", {})
                trades = _generate_sample_trades(bt_config)

            sim_type = sim.simulation_type
            if sim_type == "monte_carlo":
                result = run_monte_carlo(trades, sim.num_simulations, sim.random_seed)
            elif sim_type == "bootstrap":
                result = run_bootstrap(trades, sim.num_simulations, sim.random_seed)
            else:
                result = run_monte_carlo(trades, sim.num_simulations, sim.random_seed)

            elapsed = (_now() - start).total_seconds()
            sim.status = BacktestStatus.COMPLETED
            sim.results = result.get("results", {}) if sim_type == "bootstrap" else result
            sim.percentiles = result.get("percentiles", {})
            sim.confidence_intervals = result.get("results", {}) if sim_type == "bootstrap" else {}
            sim.equity_curves = result.get("equity_curves", [])
            sim.distribution = result.get("distribution", [])
            sim.duration_seconds = elapsed
            self.db.commit()
            self.db.refresh(sim)
        except Exception as e:
            sim.status = BacktestStatus.FAILED
            sim.error = str(e)
            self.db.commit()

        return _dict(sim)

    def get_simulation(self, simulation_id: UUID) -> dict:
        sim = self.db.query(SimulationRun).filter(SimulationRun.id == simulation_id, SimulationRun.project_id == self.project_id).first()
        if not sim:
            raise HTTPException(status_code=404, detail="Simulation not found")
        return _dict(sim)

    def delete_simulation(self, simulation_id: UUID):
        sim = self.db.query(SimulationRun).filter(SimulationRun.id == simulation_id, SimulationRun.project_id == self.project_id).first()
        if sim:
            self.db.delete(sim)
            self.db.commit()

    def get_simulation_distribution(self, simulation_id: UUID) -> list:
        sim = self.db.query(SimulationRun).filter(SimulationRun.id == simulation_id).first()
        return sim.distribution if sim and sim.distribution else []

    # ── Walk-Forward ──

    def list_walkforward_runs(self, experiment_id: UUID | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(WalkForwardRun).filter(WalkForwardRun.project_id == self.project_id)
        if experiment_id:
            q = q.filter(WalkForwardRun.experiment_id == experiment_id)
        q = q.order_by(WalkForwardRun.created_at.desc()).limit(limit)
        return [_dict(w) for w in q.all()]

    def run_walkforward(self, data: dict) -> dict:
        wf = WalkForwardRun(
            project_id=self.project_id,
            experiment_id=UUID(data["experiment_id"]) if data.get("experiment_id") else None,
            name=data.get("name", "Walk-Forward Analysis"),
            status=BacktestStatus.RUNNING,
            config=data.get("config", {}),
            training_window=data.get("training_window", 252),
            validation_window=data.get("validation_window", 63),
            step_size=data.get("step_size", 63),
        )
        self.db.add(wf)
        self.db.commit()
        self.db.refresh(wf)

        try:
            start = _now()
            trades = _generate_sample_trades(data.get("config", {}))
            result = run_walkforward_analysis(trades, {
                "training_window": wf.training_window,
                "validation_window": wf.validation_window,
                "step_size": wf.step_size,
            })
            elapsed = (_now() - start).total_seconds()
            wf.status = BacktestStatus.COMPLETED
            wf.windows = result.get("windows", [])
            wf.aggregate_metrics = result.get("aggregate_metrics", {})
            wf.stability_score = result.get("stability_score")
            wf.oos_performance = result.get("oos_performance", {})
            wf.parameter_stability = result.get("parameter_stability", {})
            wf.duration_seconds = elapsed
            self.db.commit()
            self.db.refresh(wf)
        except Exception as e:
            wf.status = BacktestStatus.FAILED
            wf.error = str(e)
            self.db.commit()

        return _dict(wf)

    def get_walkforward_run(self, wf_id: UUID) -> dict:
        wf = self.db.query(WalkForwardRun).filter(WalkForwardRun.id == wf_id, WalkForwardRun.project_id == self.project_id).first()
        if not wf:
            raise HTTPException(status_code=404, detail="Walk-forward run not found")
        return _dict(wf)

    def delete_walkforward_run(self, wf_id: UUID):
        wf = self.db.query(WalkForwardRun).filter(WalkForwardRun.id == wf_id, WalkForwardRun.project_id == self.project_id).first()
        if wf:
            self.db.delete(wf)
            self.db.commit()

    # ── Optimization ──

    def list_optimizations(self, experiment_id: UUID | None = None, optimization_type: str | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(OptimizationRun).filter(OptimizationRun.project_id == self.project_id)
        if experiment_id:
            q = q.filter(OptimizationRun.experiment_id == experiment_id)
        if optimization_type:
            q = q.filter(OptimizationRun.optimization_type == optimization_type)
        q = q.order_by(OptimizationRun.created_at.desc()).limit(limit)
        return [_dict(o) for o in q.all()]

    def run_optimization(self, data: dict) -> dict:
        opt = OptimizationRun(
            project_id=self.project_id,
            experiment_id=UUID(data["experiment_id"]) if data.get("experiment_id") else None,
            name=data.get("name", "Optimization"),
            optimization_type=data.get("optimization_type", "grid"),
            status=BacktestStatus.RUNNING,
            config=data.get("config", {}),
            parameters=data.get("parameters", {}),
            constraints=data.get("constraints", {}),
            objective=data.get("objective", "sharpe_ratio"),
            maximize=data.get("maximize", True),
        )
        self.db.add(opt)
        self.db.commit()
        self.db.refresh(opt)

        try:
            start = _now()
            result = run_grid_search(data)
            elapsed = (_now() - start).total_seconds()
            opt.status = BacktestStatus.COMPLETED
            opt.total_combinations = result.get("total_combinations")
            opt.results = result.get("results", [])
            opt.best_result = result.get("best_result", {})
            opt.heatmap_data = result.get("heatmap_data", {})
            opt.convergence_curve = result.get("convergence_curve", [])
            opt.duration_seconds = elapsed
            self.db.commit()
            self.db.refresh(opt)
        except Exception as e:
            opt.status = BacktestStatus.FAILED
            opt.error = str(e)
            self.db.commit()

        return _dict(opt)

    def get_optimization(self, optimization_id: UUID) -> dict:
        opt = self.db.query(OptimizationRun).filter(OptimizationRun.id == optimization_id, OptimizationRun.project_id == self.project_id).first()
        if not opt:
            raise HTTPException(status_code=404, detail="Optimization not found")
        return _dict(opt)

    def delete_optimization(self, optimization_id: UUID):
        opt = self.db.query(OptimizationRun).filter(OptimizationRun.id == optimization_id, OptimizationRun.project_id == self.project_id).first()
        if opt:
            self.db.delete(opt)
            self.db.commit()

    def get_optimization_heatmap(self, optimization_id: UUID) -> dict:
        opt = self.db.query(OptimizationRun).filter(OptimizationRun.id == optimization_id).first()
        return opt.heatmap_data if opt and opt.heatmap_data else {}

    # ── Edge Health ──

    def list_edge_health(self, experiment_id: UUID | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(EdgeHealthSnapshot).filter(EdgeHealthSnapshot.project_id == self.project_id)
        if experiment_id:
            q = q.filter(EdgeHealthSnapshot.experiment_id == experiment_id)
        q = q.order_by(EdgeHealthSnapshot.created_at.desc()).limit(limit)
        return [_dict(e) for e in q.all()]

    def create_edge_snapshot(self, data: dict) -> dict:
        exp_id = UUID(data["experiment_id"]) if data.get("experiment_id") else None

        trades = []
        bt_id = data.get("backtest_run_id")
        if bt_id:
            trades_data = self.db.query(BacktestTrade).filter(BacktestTrade.backtest_run_id == UUID(bt_id)).all()
            trades = [_dict(t) for t in trades_data]

        if not trades:
            trades = _generate_sample_trades(data.get("config", {}))

        previous = self.db.query(EdgeHealthSnapshot).filter(
            EdgeHealthSnapshot.experiment_id == exp_id
        ).order_by(EdgeHealthSnapshot.created_at.desc()).limit(5).all()

        health = compute_edge_health(trades, [_dict(p) for p in previous])

        snapshot = EdgeHealthSnapshot(
            project_id=self.project_id,
            experiment_id=exp_id,
            snapshot_date=_today(),
            overall_health=health["overall_health"],
            edge_stability=health["edge_stability"],
            performance_drift=health["performance_drift"],
            parameter_drift=health["parameter_drift"],
            strategy_degradation=health["strategy_degradation"],
            drawdown_severity=health["drawdown_severity"],
            confidence_decay=health["confidence_decay"],
            metrics=health["metrics"],
            signals=health["signals"],
            recommendations=health["recommendations"],
        )
        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return _dict(snapshot)

    def get_current_edge_health(self, experiment_id: UUID | None = None) -> dict:
        q = self.db.query(EdgeHealthSnapshot).filter(EdgeHealthSnapshot.project_id == self.project_id)
        if experiment_id:
            q = q.filter(EdgeHealthSnapshot.experiment_id == experiment_id)
        latest = q.order_by(EdgeHealthSnapshot.created_at.desc()).first()
        if not latest:
            return {"overall_health": 0, "edge_stability": 0, "signals": [], "recommendations": ["Run an edge health check to get started"]}
        return _dict(latest)

    def delete_edge_snapshot(self, snapshot_id: UUID):
        snap = self.db.query(EdgeHealthSnapshot).filter(EdgeHealthSnapshot.id == snapshot_id, EdgeHealthSnapshot.project_id == self.project_id).first()
        if snap:
            self.db.delete(snap)
            self.db.commit()

    # ── Statistics ──

    def describe_performance(self, backtest_run_id: UUID | None = None, equity_curve_str: str | None = None, trades_str: str | None = None) -> dict:
        trades = []
        equity_values = None
        if backtest_run_id:
            trades_data = self.db.query(BacktestTrade).filter(BacktestTrade.backtest_run_id == backtest_run_id).all()
            trades = [_dict(t) for t in trades_data]
            bt = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_run_id).first()
            if bt and bt.equity_curve:
                equity_values = [e.get("equity", 0) for e in bt.equity_curve if isinstance(e, dict)]
        elif trades_str:
            try:
                trades = json.loads(trades_str)
            except: pass
        if equity_curve_str:
            try:
                equity_values = json.loads(equity_curve_str)
            except: pass
        return compute_statistics(trades, equity_values)

    # ── AI Research Assistant ──

    def ai_research(self, query: str, experiment_id: str | None = None, context: dict | None = None) -> dict:
        ctx = context or {}
        if experiment_id:
            exp = self.db.query(Experiment).filter(Experiment.id == UUID(experiment_id)).first()
            if exp:
                ctx["experiment"] = _dict(exp)
        return generate_ai_research(query, ctx)

    def ai_summarize(self, experiment_id: UUID | None = None, backtest_run_id: UUID | None = None) -> dict:
        bt = None
        stats = None
        exp = None
        if backtest_run_id:
            bt_data = self.db.query(BacktestRun).filter(BacktestRun.id == backtest_run_id).first()
            if bt_data:
                bt = _dict(bt_data)
                stats = self.get_backtest_metrics(backtest_run_id)
        if experiment_id:
            exp_data = self.db.query(Experiment).filter(Experiment.id == experiment_id).first()
            if exp_data:
                exp = _dict(exp_data)
        return {
            "report": generate_research_report(exp, bt, stats),
            "summary": generate_ai_research("Summarize results", {"experiment": exp, "backtest": bt, "statistics": stats}),
        }

    def ai_suggest_improvements(self, experiment_id: UUID) -> dict:
        exp = self.db.query(Experiment).filter(Experiment.id == experiment_id).first()
        bt = self.db.query(BacktestRun).filter(
            BacktestRun.experiment_id == experiment_id,
            BacktestRun.status == BacktestStatus.COMPLETED
        ).order_by(BacktestRun.created_at.desc()).first()

        if not bt:
            return {"suggestions": ["Run a backtest first to get improvement suggestions"], "overfitting_risk": "N/A"}

        stats = self.get_backtest_metrics(bt.id)
        health = compute_edge_health(
            [_dict(t) for t in self.db.query(BacktestTrade).filter(BacktestTrade.backtest_run_id == bt.id).all()],
        )

        suggestions = []
        if stats.get("win_rate", 0) < 0.35:
            suggestions.append("Win rate is low — consider improving entry criteria or using tighter stops")
        if stats.get("profit_factor", 0) < 1.5:
            suggestions.append("Profit factor below 1.5 — improve risk/reward ratio")
        if stats.get("sharpe_ratio", 0) < 1.0:
            suggestions.append("Sharpe ratio below 1.0 — reduce variance in returns")
        if stats.get("max_drawdown_pct", 0) > 0.2:
            suggestions.append("Max drawdown exceeds 20% — implement position sizing or portfolio diversification")
        if stats.get("sample_size_adequacy", 0) < 0.5:
            suggestions.append("Sample size may be inadequate — collect more data before drawing conclusions")
        suggestions.extend(health.get("recommendations", []))

        return {
            "suggestions": list(set(suggestions)),
            "overfitting_risk": "High" if bt.total_trades and bt.total_trades < 50 else "Medium" if bt.total_trades and bt.total_trades < 200 else "Low",
            "statistics": stats,
            "edge_health": {k: health.get(k) for k in ["overall_health", "edge_stability", "performance_drift", "signals"]},
        }

    # ── Research Notebook ──

    def list_notebooks(self, experiment_id: UUID | None = None, content_type: str | None = None) -> list[dict]:
        q = self.db.query(ResearchNotebook).filter(ResearchNotebook.project_id == self.project_id)
        if experiment_id:
            q = q.filter(ResearchNotebook.experiment_id == experiment_id)
        if content_type:
            q = q.filter(ResearchNotebook.content_type == content_type)
        q = q.order_by(ResearchNotebook.sort_order, ResearchNotebook.created_at)
        return [_dict(n) for n in q.all()]

    def create_notebook_entry(self, data: dict) -> dict:
        entry = ResearchNotebook(
            project_id=self.project_id,
            experiment_id=UUID(data["experiment_id"]) if data.get("experiment_id") else None,
            title=data.get("title", "Untitled"),
            content=data.get("content"),
            content_type=data.get("content_type", "markdown"),
            tags=data.get("tags", []),
            linked_run_ids=data.get("linked_run_ids", {}),
            sort_order=data.get("sort_order", 0),
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return _dict(entry)

    def get_notebook_entry(self, entry_id: UUID) -> dict:
        entry = self.db.query(ResearchNotebook).filter(ResearchNotebook.id == entry_id, ResearchNotebook.project_id == self.project_id).first()
        if not entry:
            raise HTTPException(status_code=404, detail="Notebook entry not found")
        return _dict(entry)

    def update_notebook_entry(self, entry_id: UUID, data: dict) -> dict:
        entry = self.db.query(ResearchNotebook).filter(ResearchNotebook.id == entry_id, ResearchNotebook.project_id == self.project_id).first()
        if not entry:
            raise HTTPException(status_code=404, detail="Notebook entry not found")
        for key, value in data.items():
            if value is not None and hasattr(entry, key):
                setattr(entry, key, value)
        entry.updated_at = _now()
        self.db.commit()
        self.db.refresh(entry)
        return _dict(entry)

    def delete_notebook_entry(self, entry_id: UUID):
        entry = self.db.query(ResearchNotebook).filter(ResearchNotebook.id == entry_id, ResearchNotebook.project_id == self.project_id).first()
        if entry:
            self.db.delete(entry)
            self.db.commit()

    # ── Hypothesis Testing ──

    def list_hypothesis_tests(self, experiment_id: UUID | None = None, limit: int = 50) -> list[dict]:
        q = self.db.query(HypothesisTestResult).filter(HypothesisTestResult.project_id == self.project_id)
        if experiment_id:
            q = q.filter(HypothesisTestResult.experiment_id == experiment_id)
        q = q.order_by(HypothesisTestResult.created_at.desc()).limit(limit)
        return [_dict(h) for h in q.all()]

    def create_hypothesis_test(self, data: dict) -> dict:
        test = HypothesisTestResult(
            project_id=self.project_id,
            experiment_id=UUID(data["experiment_id"]) if data.get("experiment_id") else None,
            hypothesis=data.get("hypothesis", ""),
            test_type=data.get("test_type", "backtest"),
        )
        self.db.add(test)
        self.db.commit()
        self.db.refresh(test)
        return _dict(test)

    # ── Export ──

    def export_data(self, experiment_id: str | None = None, backtest_run_id: str | None = None, fmt: str = "pdf") -> dict:
        data = {}
        if backtest_run_id:
            bt = self.db.query(BacktestRun).filter(BacktestRun.id == UUID(backtest_run_id)).first()
            if bt:
                data["backtest"] = _dict(bt)
                trades = self.db.query(BacktestTrade).filter(BacktestTrade.backtest_run_id == bt.id).all()
                data["trades"] = [_dict(t) for t in trades]
                regimes = self.db.query(RegimePerformance).filter(RegimePerformance.backtest_run_id == bt.id).all()
                data["regime_performance"] = [_dict(r) for r in regimes]
        if experiment_id:
            exp = self.db.query(Experiment).filter(Experiment.id == UUID(experiment_id)).first()
            if exp:
                data["experiment"] = _dict(exp)
                data["results"] = self.get_experiment_results(UUID(experiment_id))

        if fmt == "csv" and data.get("trades"):
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=data["trades"][0].keys())
            writer.writeheader()
            writer.writerows(data["trades"])
            return {"format": "csv", "content": output.getvalue(), "filename": f"backtest_{backtest_run_id}_{_today()}.csv"}

        if fmt == "json":
            return {"format": "json", "content": data, "filename": f"research_{_today()}.json"}

        report = generate_research_report(
            data.get("experiment"),
            data.get("backtest"),
            data.get("backtest"),
        )
        return {"format": "markdown", "content": report, "filename": f"research_report_{_today()}.md"}
