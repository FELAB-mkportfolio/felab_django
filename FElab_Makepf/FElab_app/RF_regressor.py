from sklearn.ensemble import RandomForestRegressor
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
class RF_model():
    def getDf(self,data):
        X_data = data[data.drop(['Date','Kospi'],axis=1).columns]
        y_data = data[['Kospi']]
        #정규화
        ss = StandardScaler()
        X_scaled = ss.fit_transform(X_data)
        y_scaled = ss.fit_transform(y_data)
        x_train, x_test, y_train, y_test = train_test_split(X_scaled, y_scaled, test_size=0.3,shuffle=True)
        # 학습 진행
        forest = RandomForestRegressor(n_estimators=100)
        forest.fit(x_train, y_train)
        
        return list(forest.feature_importances_)
    def retCorr(self,data):
        corr= list(data.corr(method='pearson')['Kospi'].drop(['Kospi']))
        n_corr = []
        for i in corr:
            n_corr.append(abs(i))
        return n_corr