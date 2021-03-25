from django.urls import path
from . import views

urlpatterns = [
    path('',views.web.home, name='home'),
    path('home/',views.web.home, name='home'),
    path('portfolio_optimize/',views.web.portfolio_optimize, name='portfolio_optimize'),
    path('ajax_portfolio_optimize_return/',views.web.ajax_portfolio_optimize_return, name='portfolio_optimize'),
    path('ajax_db_return/', views.web.ajax_db_return, name='ajax_db_return'),
    path('ajax_backtest/', views.web.ajax_backtest, name='ajax_backtest'),
    path('portfolio_backtest/',views.web.portfolio_backtest, name='portfolio_backtest'),
    path('textmining/',views.web.textmining, name='textmining'),
]
