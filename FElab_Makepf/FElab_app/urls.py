from django.urls import path
from . import views

urlpatterns = [
    path('',views.home, name='home'),
    path('home/',views.home, name='home'),
    path('portfolio_optimize/',views.portfolio_optimize, name='portfolio_optimize'),
    path('portfolio_backtest/',views.portfolio_backtest, name='portfolio_backtest'),
    path('textmining/',views.textmining, name='textmining'),
]
