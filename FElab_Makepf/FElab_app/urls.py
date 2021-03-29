from django.urls import path
from . import views

urlpatterns = [
    path('',views.home, name='home'),
    path('home/',views.home, name='home'),
    path('portfolio_optimize/',views.portfolio_optimize, name='portfolio_optimize'),
    path('ajax_portfolio_optimize_return/',views.ajax_portfolio_optimize_return, name='portfolio_optimize'),
    path('ajax_db_return/', views.ajax_db_return, name='ajax_db_return'),
    path('ajax_backtest/', views.ajax_backtest, name='ajax_backtest'),
    path('portfolio_backtest/',views.portfolio_backtest, name='portfolio_backtest'),
    path('textmining/',views.textmining, name='textmining'),
]
