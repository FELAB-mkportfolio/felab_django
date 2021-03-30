import pymysql
import datetime
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import minimize


class Models:
    def __init__(self, assets, start, end, strategy):
        self.result = None
        self.graph = None
        eon_db = pymysql.connect(
                user='root',
                password='0725',
                host='localhost',
                db='teststocks',
                charset='utf8' ) 
        cursor = eon_db.cursor(pymysql.cursors.DictCursor)
        data = pd.DataFrame()
        start = datetime.datetime.strptime(start, "%Y-%m-%d")
        end = datetime.datetime.strptime(end, "%Y-%m-%d")
        for asset in assets:
            sql = "SELECT * FROM teststocks." + asset + ";"
            cursor.execute(sql)
            result = cursor.fetchall()
            result = pd.DataFrame(result)

            result.index = result['Date']
            result.drop(['Open','High','Low','Volume','Change','Date'],axis=1, inplace=True)
            result.rename(columns={'Close': asset}, inplace=True)

            result = result.loc[start:end]
            data = pd.concat([data, result], axis=1)
        
        
        if data.isnull().values.any() == True: #불러온 data에 결측있으면 x
            print("입력 기간 내 데이터가 없습니다.")
        else:
            data = data.resample('M').mean() #일별 데이터를 월별 데이터로 만들어줌
            data = data.pct_change() #월별 주가 데이터를 이용해 수익률 데이터로 변환
            data.dropna(inplace=True) #결측치 제외(첫 row)

            self.data = data
            self.mu = data.mean() * 12
            self.cov = data.cov() * 12
            self.strategy = strategy
            
            if "GMV" in strategy:
                self.result = list(self.gmv_opt())
                #self.graph = self.efplot()
            elif "Sharp" in strategy:
                self.result  = list(self.ms_opt())
                #self.graph = self.efplot()
            elif "Parity" in strategy:
                self.result = list(self.rp_opt())
                #self.graph = self.efplot()
            else:
                self.result = print("전략이 잘못 입력되었습니다. ")
    
    def gmv_opt(self):
        n_assets = len(self.data.columns)
        w0 = np.ones(n_assets) / n_assets
        fun = lambda w: np.dot(w.T, np.dot(self.cov, w))
        constraints = ({'type':'eq', 'fun':lambda x: np.sum(x)-1})
        bd = ((0,1),) * n_assets
        #cov = data.cov() * 12
        
        gmv = minimize(fun, w0, method = 'SLSQP', constraints=constraints, bounds=bd)
        return gmv.x
    
    def ms_opt(self):
        #f_ret = lambda w: np.dot(w.T, self.mu)
        #f_risk = lambda w: np.sqrt(np.dot(w.T, np.dot(self.cov, w)))
        
        n_assets = len(self.data.columns)
        w0 = np.ones(n_assets) / n_assets
        fun = lambda w: -(np.dot(w.T, self.mu) / np.sqrt(np.dot(w.T, np.dot(self.cov, w))))
        #un = - (pf_ret / pf_risk)
        bd = ((0,1),) * n_assets     
        constraints = ({'type': 'eq', 'fun': lambda x:  np.sum(x) - 1})

        maxsharp = minimize(fun, w0, method ='SLSQP', constraints=constraints, bounds=bd)
        return maxsharp.x
    
    def rp_opt(self):
        def RC(w):
            pfo_std = np.sqrt(np.dot(w.T, np.dot(self.cov, w)))
            mrc = 1/pfo_std * (np.dot(self.cov, w))
            rc = mrc * w
            rc = rc / rc.sum()
            return rc
        
        
        def RP_objective(x):
            pfo_std = np.sqrt(np.dot(x.T, np.dot(self.cov, x)))
            mrc = 1/pfo_std * (np.dot(self.cov, x))
            rc = mrc * x
            rc = rc / rc.sum()

            a = np.reshape(rc, (len(rc),1))
            differs = a - a.T
            objective = np.sum(np.square(differs))

            return objective    
        
        n_assets = len(self.data.columns)
        w0 = np.ones(n_assets) / n_assets
        #pfo_std = lambda w: np.sqrt(np.dot(w.T, np.dot(self.cov, w)))
        #mrc = lambda w: 1/pfo_std * (np.dot(self.cov, w))
        #rc = lambda w: mrc * w
        #rc = rc / rc.sum()

        #a = np.reshape(rc, (rc,1))
        #differs = a - a.T
        #fun = np.sum(np.square(differs))
        constraints = [{'type':'eq', 'fun': lambda x: np.sum(x) -1},
                       {'type':'ineq', 'fun': lambda x: x}]

        rp = minimize(RP_objective, w0,  constraints=constraints, method='SLSQP')

        return rp.x     #, RC(self.cov, rp.x)
    
    def plotting(self):
        ret_gmv = np.dot(self.gmv_opt(), self.mu)
        ret_ms = np.dot(self.ms_opt(), self.mu)
        ret_rp = np.dot(self.rp_opt(), self.mu)
        vol_gmv = np.sqrt(np.dot(self.gmv_opt(), np.dot(self.cov, self.gmv_opt())))
        vol_ms = np.sqrt(np.dot(self.ms_opt(), np.dot(self.cov, self.ms_opt())))
        vol_rp = np.sqrt(np.dot(self.rp_opt(), np.dot(self.cov, self.rp_opt())))
        
        trets = np.linspace(ret_gmv, max(self.mu), 30) # 30개 짜르기 
        tvols = []
        efpoints = dict()
        for i, tret in enumerate(trets): #이 개별 return마다 최소 risk 찾기
            n_assets = len(self.data.columns)
            w0 = np.ones(n_assets) / n_assets
            fun = lambda w: np.sqrt(np.dot(w.T ,np.dot(self.cov, w)))
            constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1},
                           {'type': 'ineq', 'fun': lambda x: np.dot(x, self.mu) - tret}]
                           #{'type': 'ineq', 'fun': lambda x: x}]

            minvol = minimize(fun, w0, method='SLSQP', constraints=constraints)
            tvols.append(np.sqrt(np.dot(minvol.x, np.dot(self.cov, minvol.x))))
            
            pnumber = str(i+1) + "point"
            efpoints[pnumber] = minvol.x
            
            
        ret_vol = {"GMV": [vol_gmv, ret_gmv], "MaxSharp": [vol_ms, ret_ms], "RiskParity": [vol_rp, ret_rp]}
        tret_tvol = {"Trets" : trets, "Tvols": tvols}
        
        if self.data.shape[0] <= 1:
            error = '기간에러'
            return error
        else:
            return ret_vol, tret_tvol, efpoints