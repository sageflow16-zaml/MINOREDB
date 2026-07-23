from src.broker.providers.base import BrokerProviderBase
from src.broker.providers.registry import ProviderRegistry
from src.broker.providers.metatrader4 import MetaTrader4Provider
from src.broker.providers.metatrader5 import MetaTrader5Provider
from src.broker.providers.ctrader import CTraderProvider
from src.broker.providers.dxtrade import DXtradeProvider
from src.broker.providers.interactive_brokers import InteractiveBrokersProvider
from src.broker.providers.oanda import OandaProvider
from src.broker.providers.tradelocker import TradeLockerProvider
from src.broker.providers.binance import BinanceProvider
from src.broker.providers.bybit import BybitProvider
from src.broker.providers.kraken import KrakenProvider
from src.broker.providers.custom_rest import CustomRESTProvider

# ── Auto-register all providers ──
ProviderRegistry.register(MetaTrader4Provider)
ProviderRegistry.register(MetaTrader5Provider)
ProviderRegistry.register(CTraderProvider)
ProviderRegistry.register(DXtradeProvider)
ProviderRegistry.register(InteractiveBrokersProvider)
ProviderRegistry.register(OandaProvider)
ProviderRegistry.register(TradeLockerProvider)
ProviderRegistry.register(BinanceProvider)
ProviderRegistry.register(BybitProvider)
ProviderRegistry.register(KrakenProvider)
ProviderRegistry.register(CustomRESTProvider)

__all__ = [
    "BrokerProviderBase", "ProviderRegistry",
    "MetaTrader4Provider", "MetaTrader5Provider", "CTraderProvider",
    "DXtradeProvider", "InteractiveBrokersProvider", "OandaProvider",
    "TradeLockerProvider", "BinanceProvider", "BybitProvider",
    "KrakenProvider", "CustomRESTProvider",
]
