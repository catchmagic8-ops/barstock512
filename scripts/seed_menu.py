V = "Wegetariańskie"
W = "Wegańskie"

# (category, name, description, price, dietary)
DATA = [
 ("Przekąski","Pikantne skrzydełka","Skrzydełka z kurczaka w pikantnym sosie z chili, miodu, sezamu i kolendry",42,[]),
 ("Przekąski",'Bataty „dirty fries”',"Chrupiące frytki z batatów, jogurt czosnkowy, dojrzewający parmezan",32,[V]),
 ("Przekąski","Burrata","Kremowa burrata, truskawki i pomidory, oliwa bazyliowo-miętowa",54,[V]),
 ("Przekąski","Hummus śródziemnomorski","Hummus z ciecierzycy, tahini, sezonowe warzywa, pita, oliwa extra virgin",46,[V,W]),
 ("Przekąski","Szaszłyk z polędwiczki wieprzowej","Grillowana polędwiczka, maślanka, francuska musztarda, świeże zioła",68,[]),
 ("Przekąski","Kofta wołowa","Grillowana wołowina, mięta, lekki sos jogurtowy z ogórkiem",68,[]),
 ("Przekąski","Antipasti","Starannie dobrana selekcja włoskich wędlin i serów, oliwki, marynowane warzywa, rzemieślnicze pieczywo",64,[]),

 ("Pizza","Letnia Burrata","Lekka kompozycja z burratą, pomidorami, cytrusową oliwą i świeżą bazylią",56,[V]),
 ("Pizza","Kurczak BBQ","Grillowany kurczak w glazurze BBQ, czerwona cebula, rukola",68,[]),
 ("Pizza","Pepperoni","Intensywne salami pepperoni, pomidory, jalapeño",68,[]),

 ("Sałatki","Caesar","Sałata rzymska, parmezan, chrupiące grzanki, autorski sos Cezar. Z grillowanym kurczakiem 51 PLN, z krewetkami 56 PLN",45,[V]),
 ("Sałatki","Rukola","Rukola, świeże figi i maliny, mini mozzarella, redukcja balsamiczna",49,[V]),

 ("Pomiędzy bułkami","Club sandwich","Grillowany kurczak, chrupiący boczek, jajko sadzone, sałata rzymska, pomidor, majonez, frytki",58,[]),
 ("Pomiędzy bułkami","Burger wołowy","Selekcjonowana wołowina, cheddar, boczek, ogórek piklowany, pomidor, rukola, frytki",68,[]),
 ("Pomiędzy bułkami","Tacos z kurczakiem","Chrupiąca tortilla, grillowany kurczak, świeże warzywa, jogurt miętowy, limonka",56,[]),
 ("Pomiędzy bułkami","Rybne tacos","Panierowany dorsz, mango, kolendra, limonka",65,[]),

 ("Zupy","Żurek","Tradycyjny żurek na domowym zakwasie, jajko, świeży chrzan",40,[]),
 ("Zupy","Velouté z owoców morza","Kremowa zupa z krewetkami i małżami, mleczko kokosowe, curry",48,[]),

 ("Makarony","Krewetki z czosnkiem","Domowy makaron, krewetki, czosnek, świeże pesto",72,[]),
 ("Makarony","Bolognese","Wołowina, świeży makaron, ser Grana Padano",68,[]),

 ("Dania główne","Rib-Eye Namibia","Sezonowany stek rib-eye, ziemniaki pieczone w soli, rukola, pomidory, redukcja balsamiczna",165,[]),
 ("Dania główne","Kurczak Madras","Kurczak w aromatycznym sosie madras, szpinak, migdały, pita",69,[]),
 ("Dania główne","Grillowany łosoś","Filet z łososia, ziemniaki pieczone w soli, świeża sałatka, dip jogurtowy",89,[]),
 ("Dania główne","Krewetki królewskie","Chrupiące krewetki królewskie w panierce panko, sos chili",88,[]),
 ("Dania główne","Żeberka wieprzowe „Klon i Kawa”","Żeberka wieprzowe w glazurze klonowo-kawowej, ziemniaki pieczone w soli, sałatka",74,[]),

 ("Słodkości","Pistacja","Crémeux bergamotka i mango, biszkopt pistacjowy, oliwa z pestek dyni",35,[V]),
 ("Słodkości","Napoleonka","Warstwowe ciasto francuskie, krem chantilly, maliny, sorbet",35,[V]),
 ("Słodkości","Czekoladowa Magdalenka","Ciepła magdalenka czekoladowa, słony karmel, lody waniliowe, puder z herbaty Earl Grey",35,[V]),

 ("Dla dzieci","Rosół z kurczaka z domowym makaronem","Na początek",26,[]),
 ("Dla dzieci","Krem z pomidorów","Na początek",26,[V]),
 ("Dla dzieci","Pierogi z serem i kwaśną śmietaną","Kontynuacja",30,[V]),
 ("Dla dzieci","Chrupiące paluszki rybne z dorsza","Frytki, surówka z kapusty i jabłek",58,[]),
 ("Dla dzieci","Nuggetsy z kurczaka","Frytki i grillowane brokuły",50,[]),
 ("Dla dzieci","Mini burger","Podawany z frytkami",36,[]),
 ("Dla dzieci","Domowe naleśniki","Podawane z jagodami i sosem truskawkowym",30,[V]),
 ("Dla dzieci","Wybór lodów","Bita śmietana i owoce sezonowe",30,[V]),

 ("Koktajle firmowe","Passenger Princess","Wódka Belvedere, Cointreau, brzoskwinia, piernik, limonka, tonik grejpfrutowy",55,[]),
 ("Koktajle firmowe","Punisher","Woodford Reserve, Ardbeg, białko, cytryna, marakuja, syrop cukrowy",55,[]),
 ("Koktajle firmowe","Lychee Blossom","Beefeater Gin, liczi, cytryna, syrop cukrowy",46,[]),
 ("Koktajle firmowe","Cucumber Fusion","Wódka Ostoya cucumber, limonka, woda gazowana, syrop cukrowy",46,[]),
 ("Koktajle firmowe","Irish Lemonade","Jameson Orange Whiskey, Cointreau, limonka, woda gazowana, syrop cukrowy",50,[]),
 ("Koktajle firmowe","La Dolce Vita","Malfy Limone Gin, Galliano, wermut dry, Italicus",55,[]),
 ("Koktajle firmowe","Pineapple Story","Hennessy Cognac, ananas, limonka, tonik imbirowy",52,[]),
 ("Koktajle firmowe","Botucado","Wódka Belvedere, Ardbeg, migdał, cytryna, białko, syrop imbirowy",54,[]),

 ("Spritzery","Gracias","Porto, jeżyna, angostura bitters, Schweppes",48,[]),
 ("Spritzery","Miranda","Wino białe, Cointreau, ananas, cytryna, syrop cukrowy, białko",49,[]),
 ("Spritzery","Cucumber Spritz","Chandon Garden Spritz, ogórek, limonka",46,[]),
 ("Spritzery","Golden Hour","Beefeater Gin, Chandon Garden Spritz, wódka różana, syrop cukrowy",49,[]),

 ("Moktajle","Passenger Princess Driver","Żurawina, brzoskwinia, piernik, limonka, tonik grejpfrutowy — bez alkoholu",46,[W]),
 ("Moktajle","Pornstar Martini 0%","Marakuja, wanilia, limonka, wino musujące 0%",40,[W]),
 ("Moktajle","Barbie","Beefeater Gin 0%, limonka, tonik różany",46,[W]),
 ("Moktajle","Lychee Breeze","Beefeater Gin 0%, syrop cukrowy, cytryna, liczi, tonik grejpfrutowy",46,[W]),

 ("Szampany i wina musujące","G.H. Mumm Grand Cordon 12%","100 ml – 80 PLN / 750 ml – 600 PLN",80,[]),
 ("Szampany i wina musujące","G.H. Mumm Grand Cordon Rosé 12%","750 ml – 750 PLN",750,[]),
 ("Szampany i wina musujące","G.H. Mumm Ice X-tra 12,5%","750 ml – 650 PLN",650,[]),
 ("Szampany i wina musujące","Moët & Chandon Brut Impérial 12,5%","100 ml – 80 PLN / 750 ml – 600 PLN",80,[]),
 ("Szampany i wina musujące","Perrier-Jouët Grand Brut 12,5%","750 ml – 700 PLN",700,[]),
 ("Szampany i wina musujące","Dom Pérignon 12,5%","750 ml – 3000 PLN",3000,[]),
 ("Szampany i wina musujące","Baglietti Prosecco Brut 12%","100 ml – 38 PLN / 750 ml – 260 PLN",38,[]),
 ("Szampany i wina musujące","Chandon Garden Spritz 11,5%","100 ml – 46 PLN / 750 ml – 230 PLN",46,[]),
 ("Szampany i wina musujące","Perrier-Jouët Blason Rosé 12%","750 ml – 800 PLN",800,[]),

 ("Wino białe","Pinot Grigio del Veneto „L’Elfo”, Włochy 12%","150 ml – 38 PLN / 750 ml – 180 PLN",38,[]),
 ("Wino białe","Chardonnay, Montes Alpha, Chile 14%","150 ml – 48 PLN / 750 ml – 220 PLN",48,[]),
 ("Wino białe","Sauvignon Blanc, Tiraki, Marlborough, Nowa Zelandia 13%","150 ml – 50 PLN / 750 ml – 230 PLN",50,[]),
 ("Wino białe","Solaris, Winnica Turnau, Zachodniopomorskie, Polska 13%","150 ml – 55 PLN / 750 ml – 265 PLN",55,[]),

 ("Wino czerwone","Bordeaux Supérieur Château de Ribebon, Francja 13,5%","150 ml – 38 PLN / 750 ml – 180 PLN",38,[]),
 ("Wino czerwone","Primitivo Pietra Salento, Włochy 14%","150 ml – 48 PLN / 750 ml – 220 PLN",48,[]),
 ("Wino czerwone","Cabernet Sauvignon, Montes Alpha, Chile 14,5%","150 ml – 50 PLN / 750 ml – 240 PLN",50,[]),
 ("Wino czerwone","Malbec, Montes Alpha, Chile 14%","150 ml – 52 PLN / 750 ml – 250 PLN",52,[]),

 ("Wino różowe","Whispering Angel, Côtes de Provence Rosé, Francja 13%","150 ml – 56 PLN / 750 ml – 275 PLN",56,[]),
 ("Wino różowe","Rosé, Winnica Turnau, Zachodniopomorskie, Polska 11%","150 ml – 45 PLN / 750 ml – 225 PLN",45,[]),

 ("Piwo","Żywiec Białe, Browar Żywiec","Piwo butelkowe 0,5 l • 4,9%",24,[]),
 ("Piwo","Żywiec APA, Browar Żywiec","Piwo butelkowe 0,5 l • 5,4%",24,[]),
 ("Piwo","Piwo Starogdańskie, Pomorski Browar Tradycyjny","Piwo butelkowe 0,5 l • 5,2%",28,[]),
 ("Piwo","Piwo Starogdańskie Classic, Pomorski Browar Tradycyjny","Piwo butelkowe 0,5 l • 6,1%",30,[]),
 ("Piwo","Żywiec 0%","Piwo butelkowe 0,33 l • 0%",20,[]),
 ("Piwo","Żywiec 0,3 l","Piwo beczkowe • 5,5%",20,[]),
 ("Piwo","Żywiec 0,5 l","Piwo beczkowe • 5,5%",26,[]),
 ("Piwo","Heineken 0,3 l","Piwo beczkowe • 5%",22,[]),
 ("Piwo","Heineken 0,5 l","Piwo beczkowe • 5%",28,[]),
 ("Piwo","Paulaner Weißbier 0,3 l","Piwo beczkowe • 5,5%",26,[]),
 ("Piwo","Paulaner Weißbier 0,5 l","Piwo beczkowe • 5,5%",32,[]),

 ("Wódka","Ostoya","40 ml • 40%",28,[]),
 ("Wódka","Ostoya Black","40 ml • 40%",28,[]),
 ("Wódka","Wyborowa","40 ml • 40%",22,[]),
 ("Wódka","Belvedere Vodka","40 ml • 40%",42,[]),
 ("Wódka","Belvedere Lake Bartężek","40 ml • 40%",52,[]),
 ("Wódka","Belvedere Forest Smogóry","40 ml • 40%",52,[]),
 ("Wódka","Chopin Potato","40 ml • 40%",40,[]),
 ("Wódka","Żubrówka Bison Grass","40 ml • 37,5%",22,[]),
 ("Wódka","Grey Goose","40 ml • 40%",46,[]),

 ("Whisky i whiskey","Chivas Regal 12 yo","40 ml • 40%",40,[]),
 ("Whisky i whiskey","Chivas XV","40 ml • 40%",48,[]),
 ("Whisky i whiskey","Chivas Regal 18 yo","40 ml • 40%",65,[]),
 ("Whisky i whiskey","Chivas Regal 25 yo","40 ml • 40%",280,[]),
 ("Whisky i whiskey","Johnnie Walker Black Label","40 ml • 40%",40,[]),
 ("Whisky i whiskey","Johnnie Walker Blue Label","40 ml • 40%",190,[]),
 ("Whisky i whiskey","Fuji Single Malt","40 ml • 46%",75,[]),
 ("Whisky i whiskey","Ardbeg 10 yo","Single malt, Islay • 40 ml • 46%",65,[]),
 ("Whisky i whiskey","Ardbeg Wee Beastie","Single malt, Islay • 40 ml • 47,4%",56,[]),
 ("Whisky i whiskey","Talisker 10 yo","Single malt, Islands • 40 ml • 45,8%",45,[]),
 ("Whisky i whiskey","The Glenlivet Founder’s Reserve","Single malt, Speyside • 40 ml • 40%",32,[]),
 ("Whisky i whiskey","The Glenlivet 15 yo","Single malt, Speyside • 40 ml • 40%",60,[]),
 ("Whisky i whiskey","The Glenlivet 18 yo","Single malt, Speyside • 40 ml • 40%",75,[]),
 ("Whisky i whiskey","Benriach The Original Ten","Single malt, Speyside • 40 ml • 43%",49,[]),
 ("Whisky i whiskey","Benriach The Smoky Ten","Single malt, Speyside • 40 ml • 46%",36,[]),
 ("Whisky i whiskey","Benriach The Twelve","Single malt, Speyside • 40 ml • 46%",46,[]),
 ("Whisky i whiskey","Benriach The Smoky Twelve","Single malt, Speyside • 40 ml • 46%",46,[]),
 ("Whisky i whiskey","Glenmorangie 12 yo","Single malt, Highland • 40 ml • 40%",48,[]),
 ("Whisky i whiskey","Glenmorangie Quinta Ruban","Single malt, Highland • 40 ml • 46%",75,[]),
 ("Whisky i whiskey","Glenmorangie Lasanta","Single malt, Highland • 40 ml • 43%",52,[]),
 ("Whisky i whiskey","Oban","Single malt, Highland • 40 ml • 43%",70,[]),
 ("Whisky i whiskey","Jameson Irish Whiskey","40 ml • 40%",30,[]),
 ("Whisky i whiskey","Jameson Black Barrel","40 ml • 40%",34,[]),
 ("Whisky i whiskey","Jameson Orange","40 ml • 30%",32,[]),
 ("Whisky i whiskey","Bushmills 10 yo","40 ml • 40%",34,[]),
 ("Whisky i whiskey","Bushmills 16 yo","40 ml • 40%",55,[]),
 ("Whisky i whiskey","Jack Daniel’s Tennessee Whiskey","Bourbon / American whiskey • 40 ml • 40%",36,[]),
 ("Whisky i whiskey","Jack Daniel’s Tennessee Honey","Bourbon / American whiskey • 40 ml • 35%",30,[]),
 ("Whisky i whiskey","Jack Daniel’s Tennessee Apple","Bourbon / American whiskey • 40 ml • 35%",30,[]),
 ("Whisky i whiskey","Jack Daniel’s Gentleman","Bourbon / American whiskey • 40 ml • 40%",40,[]),
 ("Whisky i whiskey","Woodford Reserve","Bourbon / American whiskey • 40 ml • 43,2%",50,[]),
 ("Whisky i whiskey","Woodford Reserve Rye","Bourbon / American whiskey • 40 ml • 45,2%",48,[]),
 ("Whisky i whiskey","Woodford Reserve Double Oaked","Bourbon / American whiskey • 40 ml • 43,2%",60,[]),
 ("Whisky i whiskey","Maker’s Mark","Bourbon / American whiskey • 40 ml • 45%",34,[]),
 ("Whisky i whiskey","Bulleit Rye","Bourbon / American whiskey • 40 ml • 45%",32,[]),
 ("Whisky i whiskey","Bulleit 10 yo","Bourbon / American whiskey • 40 ml • 45,6%",42,[]),

 ("Cognac i brandy","Hennessy XO","40 ml • 40%",225,[]),
 ("Cognac i brandy","Hennessy Paradis","40 ml • 40%",1000,[]),
 ("Cognac i brandy","Hennessy VSOP","40 ml • 40%",56,[]),
 ("Cognac i brandy","Hennessy VS","40 ml • 40%",42,[]),
 ("Cognac i brandy","Martell VSOP","40 ml • 40%",46,[]),
 ("Cognac i brandy","Martell XO","40 ml • 40%",200,[]),
 ("Cognac i brandy","METAXA 12*","40 ml • 40%",40,[]),

 ("Gin","Beefeater","40 ml • 40%",28,[]),
 ("Gin","Beefeater Pink","40 ml • 37,5%",30,[]),
 ("Gin","Beefeater 24","40 ml • 45%",30,[]),
 ("Gin","Beefeater Orange","40 ml • 37,5%",30,[]),
 ("Gin","Ki No Bi Original","40 ml • 45,7%",36,[]),
 ("Gin","Ki No Bi Sei","40 ml • 54,5%",40,[]),
 ("Gin","Ki No Bi Tea","40 ml • 45,1%",50,[]),
 ("Gin","Hendrick’s","40 ml • 41,4%",42,[]),
 ("Gin","Bombay Sapphire","40 ml • 40%",34,[]),
 ("Gin","Tanqueray No. Ten","40 ml • 47,3%",40,[]),
 ("Gin","Monkey 47","40 ml • 47%",56,[]),
 ("Gin","Gin Mare","40 ml • 42,7%",50,[]),

 ("Rum","Angostura White Reserva","40 ml • 37,5%",30,[]),
 ("Rum","Angostura 5 yo","40 ml • 40%",33,[]),
 ("Rum","Bumbu Rum","40 ml • 40%",44,[]),
 ("Rum","Bumbu XO","40 ml • 40%",46,[]),
 ("Rum","Dictador 20 yo","40 ml • 40%",60,[]),
 ("Rum","Ron Zacapa 23 yo","40 ml • 40%",70,[]),
 ("Rum","Zacapa XO","40 ml • 40%",150,[]),
 ("Rum","Botucal Mantuano","40 ml • 40%",36,[]),
 ("Rum","Botucal Reserva Exclusiva","40 ml • 40%",40,[]),

 ("Tequila","Olmeca Gold","40 ml • 35%",32,[]),
 ("Tequila","Olmeca Silver","40 ml • 35%",30,[]),
 ("Tequila","Olmeca Altos Plata","40 ml • 38%",36,[]),
 ("Tequila","Olmeca Altos Reposado","40 ml • 38%",38,[]),
 ("Tequila","Herradura Plata","40 ml • 40%",44,[]),
 ("Tequila","Herradura Reposado","40 ml • 40%",52,[]),

 ("Zimne napoje i soki","Pepsi / Pepsi Max / Mirinda / 7 Up / Schweppes","0,2 l",16,[W]),
 ("Zimne napoje i soki","Franklin & Sons Tonic Water","0,2 l • Indian Tonic, Grapefruit Soda, Rose, Ginger",20,[W]),
 ("Zimne napoje i soki","Red Bull","0,2 l",25,[]),
 ("Zimne napoje i soki","Sok Toma","0,2 l • pomarańczowy / jabłkowy / grejpfrutowy / czarna porzeczka / pomidorowy",15,[W]),
 ("Zimne napoje i soki","Świeżo wyciskane soki","0,2 l • pomarańczowy / grejpfrutowy / mix",27,[W]),
 ("Zimne napoje i soki","Lemoniada","0,3 l • cytrynowa / marakuja / ogórkowa",28,[W]),
 ("Zimne napoje i soki","Mrożona herbata","Zielona herbata, syrop brzoskwiniowy, cytryna",24,[W]),
 ("Zimne napoje i soki","Cisowianka niegazowana lub gazowana","0,3 l – 18 PLN / 0,7 l – 24 PLN",18,[W]),

 ("Kawa i herbata","Espresso","Kawa",16,[W]),
 ("Kawa i herbata","Podwójne espresso","Kawa",18,[W]),
 ("Kawa i herbata","Americano","Kawa",18,[W]),
 ("Kawa i herbata","Cappuccino","Kawa",21,[V]),
 ("Kawa i herbata","Caffè latte","Kawa",20,[V]),
 ("Kawa i herbata","Flat white","Kawa",21,[V]),
 ("Kawa i herbata","Kawa bezkofeinowa","Kawa",16,[W]),
 ("Kawa i herbata","Matcha kokosowa","Kawa",24,[W]),
 ("Kawa i herbata","Espresso Orange","Kawa",26,[W]),
 ("Kawa i herbata","Herbata ziołowa","Rumianek, mięta, rooibos",18,[W]),
 ("Kawa i herbata","Herbata czarna","Assam, Earl Grey",18,[W]),
 ("Kawa i herbata","Herbata zielona","Sencha Ecolada, China Jasmine",18,[W]),
 ("Kawa i herbata","Herbata owocowa","Sommerbeeren",18,[W]),
]


def q(s):
    return "'" + s.replace("'", "''") + "'"


def arr(items):
    if not items:
        return "'{}'::text[]"
    return "ARRAY[" + ",".join(q(i) for i in items) + "]::text[]"


rows = []
counters = {}
for cat, name, desc, price, diet in DATA:
    counters[cat] = counters.get(cat, 0) + 1
    rows.append(
        f"({q(cat)},{q(name)},{q(desc)},{arr([])},{arr(diet)},{price},{counters[cat]})"
    )

sql = (
    "BEGIN;\nDELETE FROM public.a_la_carte_bar512;\n"
    "INSERT INTO public.a_la_carte_bar512 (category,name,description,allergens,dietary,price_pln,sort_order) VALUES\n"
    + ",\n".join(rows)
    + ";\nCOMMIT;\n"
)
open("/tmp/menu.sql", "w").write(sql)
print(len(rows), "rows")
