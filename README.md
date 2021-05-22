# 경희대학교 학부연구 
## <포트폴리오 최적화 서비스 제공과 텍스트마이닝을 사용한 금융 데이터 분석>

> 해외의 포트폴리오 최적화 및 백테스트 사이트인 PortfolioVisualizer의 국내화 버전으로 개발한 "Name" 은 개인의 포트폴리오 최적화와 백테스트 기능을 제공하고 텍스트마이닝을 사용하여 시장, 기업, 금융 데이터를 분석하는 서비스를 제공한다. 개인 투자자의 포트폴리오 구성을 도와주고 투자지표로 삼을 데이터를 제공함으로써 국내의 개인 투자자들에게 보다 더 나은 의사결정을 할 수 있게 도와주고자 개발하였다.

## Table of Contents
_Note: This is only a navigation guide for the specification, and does not define or mandate terms for any specification-compliant documents._

- [Sections](#sections)
  - [Title](#title)
  - [Methodology](#methodology)
  - [Stacks](#stacks)
  - [Install](#install)
  - [Maintainers](#maintainers)
  - [Thanks](#thanks)
  - [License](#license)

## Sections

### Title
-WebSite 이름

### Methodology

**Frontend**
- Jquery : HTML의 클라이언트 사이드 조작을 단순화 하도록 설계된 크로스 플랫폼의 자바스크립트 라이브러리다.
- Ajax :  DB 종목 리스트 Return, 최적화, 백테스트, 뉴스 수집 등 비동기 통신에 사용
- Chartjs : 최적화 결과와 백테스트 결과에 보여줄 Chart를 그리는데 사용 [Chartjs](https://github.com/chartjs/Chart.js)
- Amchart : 주가 그래프 그리는데 사용 [Amchart](https://github.com/amcharts/amcharts4)
- HTML5
- CSS
> Reference : Socar, Apple, Toss

**Backend**

1. 
2. 포트폴리오 백테스트
  - 성과지표
    * A
    * B
  - 포트폴리오 성과 및 리밸런싱
    * A
    * B

3. 기업분석
  - 팩터모델
    * BOK, fdr
    * RF, adaboost

**DataBase**
-krmarket : 현시점에서 Kospi에 상장된 주식과 Tiger ETF의 시작가, 고가, 저가, 종가, 거래량, Rate of return의 정보가 있다. 
-stockcodename : 

**Natural Language Processing**
1. 뉴스 감성지수 분류기
  - 감성사전 구축 
    * 뉴스 플랫폼 빅카인즈에서 5년간 50만건의 경제 섹터 뉴스를 수집
    * 다음날 코스피 종가와 concat한 DataFrame을 생성
    * Konlpy.tag의 Okt.nouns를 사용하여 뉴스에서 명사만을 추출
    * 전체 기간에서 코스피가 상승한 날의 비율과 하락한 날의 비율을 구함
    * 뉴스가 나온 다음날 코스피가 전날 대비 상승했다면 해당 뉴스에 등장한 단어에 하락비율을 더해줌. 반대의 경우 상승비율을 차감.
    _상승기간과 하락기간의 비율 차이가 존재하기 때문에 Scaling하기 위함.
    * 당일 뉴스에 등장하는 단어들의 평균 감성점수를 구하여 전체 단어들의 평균 감성점수보다 크면 1 작거나 같으면 0을 labeling
  ![image](https://user-images.githubusercontent.com/56333934/118783559-2646a280-b8ca-11eb-9ed3-7cfd27233bdc.png)
  - Classifier 모델 성능 비교
    * 전처리
      - Train : Test (8:2) 
      - 독립변수 : 뉴스의 워드 임베딩 벡터
      - 종속변수 : 해당 뉴스의 감성지수 (평균보다 높으면 1 or 낮으면0)
    * 모델 
      - Bert : 0.91
      - Bi-LSTM : 0.92
  - 네이버 뉴스 API를 사용해 당일 뉴스를 수집(100건) 
  - Input으로 뉴스데이터를 넣고 감성지수값이 Output인 Bi-LSTM모델을 구축.
2. 금융 데이터 변수 중요도
  - 금, 은, WTI(유가), 환율, 나스닥, S&P500, 비트코인, 이더리움의 시세를 독립변수, 코스피 종가를 종속변수로 하여 상관계수 분석을 진행
  - 상관계수에 절대값을 취해 웹에 변수 중요도라는 카테고리로 지난 7일의 데이터를 제공.
  

### Stacks
- `Python Django`, `Python colab`, `Mysql Database`, `Tensorflow`, `Sklearn`, `한국은행API`, `네이버뉴스API`, `FinanceDataReader`, `Pandas-DataReader`

### Install
- Django App Download
- 가상환경 설치 및 라이브러리 Install
- Manage.py 가 있는 디렉토리에서 `python manage.py runserver 163.180.132.180:8080` 실행

### Maintainers
- 이근영 : 
- 김장언 : 
- 신시언 : Full Stack 개발. 
- 진주성 : 

### Thanks
- 김장호 교수님

### License
- `경희대학교 산업경영공학과 금융공학 연구실`
