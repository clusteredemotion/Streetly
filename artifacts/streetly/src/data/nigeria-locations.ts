export interface NigeriaArea { name: string }
export interface NigeriaCity {
  name: string;
  lat: number;
  lon: number;
  areas: string[];
}
export interface NigeriaState {
  name: string;
  code: string;
  capital: string;
  lat: number;
  lon: number;
  cities: NigeriaCity[];
}

export const NIGERIA_STATES: NigeriaState[] = [
  {
    name: "Lagos", code: "LA", capital: "Ikeja", lat: 6.5244, lon: 3.3792,
    cities: [
      { name: "Ikeja", lat: 6.6018, lon: 3.3515, areas: ["Allen Avenue", "Toyin Street", "Opebi", "Maryland", "Alausa", "GRA", "Obafemi Awolowo Way"] },
      { name: "Victoria Island", lat: 6.4281, lon: 3.4219, areas: ["Adeola Odeku", "Ozumba Mbadiwe", "Akin Adesola", "Ligali Ayorinde", "Ahmadu Bello Way"] },
      { name: "Lekki", lat: 6.4441, lon: 3.5322, areas: ["Lekki Phase 1", "Lekki Phase 2", "Ajah", "Chevron Drive", "Admiralty Way", "Freedom Way"] },
      { name: "Ikoyi", lat: 6.4551, lon: 3.3958, areas: ["Bourdillon Road", "Kingsway Road", "Parkview Estate", "Banana Island", "Glover Road", "Awolowo Road"] },
      { name: "Yaba", lat: 6.5130, lon: 3.3667, areas: ["Abara Street", "Commercial Avenue", "Herbert Macaulay Way", "Palm Grove", "Oyingbo"] },
      { name: "Surulere", lat: 6.4985, lon: 3.3563, areas: ["Adeniran Ogunsanya", "Bode Thomas", "Shitta", "Masha", "Randle Avenue"] },
      { name: "Lagos Island", lat: 6.4541, lon: 3.3947, areas: ["Broad Street", "Nnamdi Azikiwe", "Marina", "Lagos Bar Beach", "Balogun Market"] },
      { name: "Agege", lat: 6.6257, lon: 3.3236, areas: ["Agege Motor Road", "Old Abeokuta Road", "Iju Road"] },
      { name: "Oshodi", lat: 6.5548, lon: 3.3504, areas: ["Oshodi-Apapa Expressway", "International Airport Road", "Bolade"] },
    ]
  },
  {
    name: "Abuja (FCT)", code: "FC", capital: "Abuja", lat: 9.0579, lon: 7.4951,
    cities: [
      { name: "Central Business District", lat: 9.0631, lon: 7.4911, areas: ["Ahmadu Bello Way", "Constitution Avenue", "Shehu Shagari Way", "Independence Avenue"] },
      { name: "Wuse", lat: 9.0726, lon: 7.4711, areas: ["Wuse Zone 1", "Wuse Zone 2", "Wuse Zone 3", "Wuse Zone 4", "Adetokunbo Ademola"] },
      { name: "Garki", lat: 9.0556, lon: 7.4769, areas: ["Garki 1", "Garki 2", "Moshood Abiola Way"] },
      { name: "Maitama", lat: 9.0957, lon: 7.4822, areas: ["Benue Crescent", "Aguiyi Ironsi Street", "Gana Street", "Udi Hills"] },
      { name: "Gwarinpa", lat: 9.1133, lon: 7.4047, areas: ["First Avenue", "Third Avenue", "Fifth Avenue", "Sixth Avenue"] },
      { name: "Jabi", lat: 9.0893, lon: 7.4572, areas: ["Jabi Lake", "Aminu Kano Crescent", "Jabi Airport Road"] },
    ]
  },
  {
    name: "Rivers", code: "RI", capital: "Port Harcourt", lat: 4.8156, lon: 7.0498,
    cities: [
      { name: "Port Harcourt", lat: 4.7715, lon: 7.0134, areas: ["GRA Phase 1", "GRA Phase 2", "GRA Phase 3", "Old GRA", "Trans Amadi", "Rumuola", "Diobu"] },
      { name: "Obio-Akpor", lat: 4.8400, lon: 6.9800, areas: ["Rumuokoro", "Rumuola", "Rumuigbo", "Peter Odili Road"] },
      { name: "Eleme", lat: 4.7700, lon: 7.1600, areas: ["Eleme Junction", "Onne", "Alesa"] },
    ]
  },
  {
    name: "Kano", code: "KN", capital: "Kano", lat: 12.0022, lon: 8.5920,
    cities: [
      { name: "Kano City", lat: 12.0022, lon: 8.5920, areas: ["Bompai", "Sabon Gari", "Nasarawa", "Brigade", "Fagge", "Dala"] },
      { name: "Fagge", lat: 12.0000, lon: 8.5700, areas: ["Fagge Area", "Kwari Market", "Singer"] },
      { name: "Tarauni", lat: 12.0200, lon: 8.5500, areas: ["Tarauni Road", "Unguwan Uku"] },
    ]
  },
  {
    name: "Ogun", code: "OG", capital: "Abeokuta", lat: 7.1475, lon: 3.3619,
    cities: [
      { name: "Abeokuta", lat: 7.1475, lon: 3.3619, areas: ["Oke Popo", "Lantoro", "Ibara", "Kuto", "Ita Oshin", "Isabo"] },
      { name: "Sagamu", lat: 6.8388, lon: 3.6482, areas: ["Makun", "Oke Ado", "Camp Road"] },
      { name: "Ijebu-Ode", lat: 6.8119, lon: 3.9148, areas: ["Oke Agbo", "Ita Popo", "Lagos Road"] },
    ]
  },
  {
    name: "Oyo", code: "OY", capital: "Ibadan", lat: 7.3776, lon: 3.9470,
    cities: [
      { name: "Ibadan", lat: 7.3776, lon: 3.9470, areas: ["Bodija", "Ring Road", "Challenge", "Oluyole", "Agodi", "Secretariat", "UI Road", "Dugbe"] },
      { name: "Ogbomosho", lat: 8.1359, lon: 4.2437, areas: ["Owode", "Oja Igbo", "Takie"] },
      { name: "Oyo", lat: 7.8537, lon: 3.9320, areas: ["Owode", "Isale Afon", "Koso Road"] },
    ]
  },
  {
    name: "Anambra", code: "AN", capital: "Awka", lat: 6.2100, lon: 7.0671,
    cities: [
      { name: "Onitsha", lat: 6.1447, lon: 6.7893, areas: ["Upper Iweka", "New Market Road", "Bridge Head", "Inland Town"] },
      { name: "Awka", lat: 6.2100, lon: 7.0671, areas: ["Amawbia", "Ifite", "Zik Avenue", "School Road"] },
      { name: "Nnewi", lat: 5.9985, lon: 6.9128, areas: ["Okpunoeze", "Umudim", "Otolo", "Uruagu"] },
    ]
  },
  {
    name: "Delta", code: "DE", capital: "Asaba", lat: 6.1978, lon: 6.7425,
    cities: [
      { name: "Asaba", lat: 6.1978, lon: 6.7425, areas: ["GRA", "Summit Road", "Cable Point", "Okpanam Road"] },
      { name: "Warri", lat: 5.5167, lon: 5.7500, areas: ["GRA", "Effurun", "Uvwie", "Igbudu", "Market Road"] },
      { name: "Sapele", lat: 5.8905, lon: 5.6781, areas: ["New Layout", "Hospital Road", "Okumagba Avenue"] },
    ]
  },
  {
    name: "Enugu", code: "EN", capital: "Enugu", lat: 6.4527, lon: 7.5108,
    cities: [
      { name: "Enugu", lat: 6.4527, lon: 7.5108, areas: ["GRA", "Trans Ekulu", "Achara Layout", "Independence Layout", "New Haven", "Ogui Road"] },
      { name: "Nsukka", lat: 6.8569, lon: 7.3956, areas: ["University Road", "Odim", "Ede Oballa"] },
    ]
  },
  {
    name: "Imo", code: "IM", capital: "Owerri", lat: 5.4836, lon: 7.0343,
    cities: [
      { name: "Owerri", lat: 5.4836, lon: 7.0343, areas: ["Aladinma", "New Owerri", "World Bank", "Trans Amadi", "Wetheral Road"] },
      { name: "Orlu", lat: 5.7865, lon: 7.0382, areas: ["Eke Orlu", "Orlu Road"] },
      { name: "Okigwe", lat: 5.8614, lon: 7.3426, areas: ["Okigwe Road", "GRA"] },
    ]
  },
  {
    name: "Cross River", code: "CR", capital: "Calabar", lat: 4.9500, lon: 8.3333,
    cities: [
      { name: "Calabar", lat: 4.9500, lon: 8.3333, areas: ["Calabar South", "Calabar Municipal", "Diamond Hill", "State Housing", "Watt Market"] },
      { name: "Ikom", lat: 5.9634, lon: 8.7061, areas: ["Ikom Road", "Agbokim"] },
    ]
  },
  {
    name: "Kaduna", code: "KD", capital: "Kaduna", lat: 10.5222, lon: 7.4383,
    cities: [
      { name: "Kaduna", lat: 10.5222, lon: 7.4383, areas: ["Ungwan Rimi", "GRA", "Barnawa", "Kabala Costain", "Ali Akilu Road"] },
      { name: "Zaria", lat: 11.0622, lon: 7.7197, areas: ["Sabon Gari", "Tudun Wada", "Samaru"] },
    ]
  },
  {
    name: "Edo", code: "ED", capital: "Benin City", lat: 6.3350, lon: 5.6268,
    cities: [
      { name: "Benin City", lat: 6.3350, lon: 5.6268, areas: ["GRA", "Oba Market", "Mission Road", "Sapele Road", "Ugbowo", "New Benin"] },
      { name: "Auchi", lat: 7.0667, lon: 6.2681, areas: ["Auchi Road", "Polytechnic Road"] },
    ]
  },
  {
    name: "Akwa Ibom", code: "AK", capital: "Uyo", lat: 5.0510, lon: 7.9328,
    cities: [
      { name: "Uyo", lat: 5.0510, lon: 7.9328, areas: ["Udo Umana", "Wellington Bassey", "Aka Road", "Abak Road", "Itam"] },
      { name: "Eket", lat: 4.6431, lon: 7.9250, areas: ["ExxonMobil Road", "Eket Town"] },
    ]
  },
  {
    name: "Abia", code: "AB", capital: "Umuahia", lat: 5.5327, lon: 7.4859,
    cities: [
      { name: "Aba", lat: 5.1066, lon: 7.3661, areas: ["Ariaria Market", "Faulks Road", "Cemetery Road", "Aba-Owerri Road", "Osisioma"] },
      { name: "Umuahia", lat: 5.5327, lon: 7.4859, areas: ["Library Avenue", "Orieagu", "GRA"] },
    ]
  },
  {
    name: "Adamawa", code: "AD", capital: "Yola", lat: 9.2035, lon: 12.4954,
    cities: [
      { name: "Yola", lat: 9.2035, lon: 12.4954, areas: ["Jimeta", "Doubeli", "Luggere", "Karewa"] },
      { name: "Mubi", lat: 10.2654, lon: 13.2684, areas: ["Mubi North", "Mubi South"] },
    ]
  },
  {
    name: "Bauchi", code: "BA", capital: "Bauchi", lat: 10.3127, lon: 9.8442,
    cities: [
      { name: "Bauchi", lat: 10.3127, lon: 9.8442, areas: ["Gombe Road", "Dass Road", "GRA", "Wunti"] },
      { name: "Azare", lat: 11.6767, lon: 10.1986, areas: ["Azare Town"] },
    ]
  },
  {
    name: "Bayelsa", code: "BY", capital: "Yenagoa", lat: 4.9247, lon: 6.2642,
    cities: [
      { name: "Yenagoa", lat: 4.9247, lon: 6.2642, areas: ["Opolo", "Agudama Epie", "Kpansia", "Ekeki"] },
    ]
  },
  {
    name: "Benue", code: "BE", capital: "Makurdi", lat: 7.7301, lon: 8.5224,
    cities: [
      { name: "Makurdi", lat: 7.7301, lon: 8.5224, areas: ["High Level", "Low Level", "North Bank", "Agan"] },
      { name: "Gboko", lat: 7.3296, lon: 9.0058, areas: ["Gboko Town"] },
    ]
  },
  {
    name: "Borno", code: "BO", capital: "Maiduguri", lat: 11.8311, lon: 13.1510,
    cities: [
      { name: "Maiduguri", lat: 11.8311, lon: 13.1510, areas: ["Baga Road", "Old Maiduguri", "New GRA", "Bolori"] },
      { name: "Biu", lat: 10.6115, lon: 12.1947, areas: ["Biu Town"] },
    ]
  },
  {
    name: "Ebonyi", code: "EB", capital: "Abakaliki", lat: 6.3249, lon: 8.1137,
    cities: [
      { name: "Abakaliki", lat: 6.3249, lon: 8.1137, areas: ["Abakaliki Green", "Mile 50", "Ogoja Road"] },
    ]
  },
  {
    name: "Ekiti", code: "EK", capital: "Ado Ekiti", lat: 7.6231, lon: 5.2201,
    cities: [
      { name: "Ado Ekiti", lat: 7.6231, lon: 5.2201, areas: ["GRA", "Okeyinmi", "Fajuyi", "Basiri"] },
      { name: "Ikere Ekiti", lat: 7.5039, lon: 5.2382, areas: ["Ikere Town"] },
    ]
  },
  {
    name: "Gombe", code: "GO", capital: "Gombe", lat: 10.2897, lon: 11.1673,
    cities: [
      { name: "Gombe", lat: 10.2897, lon: 11.1673, areas: ["Pantami", "Tudun Wada", "Old Town"] },
    ]
  },
  {
    name: "Jigawa", code: "JI", capital: "Dutse", lat: 11.7583, lon: 9.3559,
    cities: [
      { name: "Dutse", lat: 11.7583, lon: 9.3559, areas: ["GRA", "Dutse Town"] },
      { name: "Hadejia", lat: 12.4540, lon: 10.0400, areas: ["Hadejia Town"] },
    ]
  },
  {
    name: "Kebbi", code: "KB", capital: "Birnin Kebbi", lat: 12.4539, lon: 4.1975,
    cities: [
      { name: "Birnin Kebbi", lat: 12.4539, lon: 4.1975, areas: ["Kalgo Road", "Suru Road", "Old GRA"] },
    ]
  },
  {
    name: "Kogi", code: "KO", capital: "Lokoja", lat: 7.7962, lon: 6.7343,
    cities: [
      { name: "Lokoja", lat: 7.7962, lon: 6.7343, areas: ["Adankolo", "Nataco", "Phase 1", "Felele"] },
      { name: "Okene", lat: 7.5542, lon: 6.2377, areas: ["Okene Town", "Junction"] },
    ]
  },
  {
    name: "Kwara", code: "KW", capital: "Ilorin", lat: 8.4799, lon: 4.5418,
    cities: [
      { name: "Ilorin", lat: 8.4799, lon: 4.5418, areas: ["GRA", "Tanke", "Challenge", "Fate Road", "Unity Road"] },
      { name: "Offa", lat: 8.1514, lon: 4.7197, areas: ["Offa Town"] },
    ]
  },
  {
    name: "Nasarawa", code: "NA", capital: "Lafia", lat: 8.4900, lon: 8.5222,
    cities: [
      { name: "Lafia", lat: 8.4900, lon: 8.5222, areas: ["GRA", "Makurdi Road", "Low Cost"] },
      { name: "Keffi", lat: 8.8450, lon: 7.8740, areas: ["Keffi Town", "Junction"] },
    ]
  },
  {
    name: "Niger", code: "NI", capital: "Minna", lat: 9.6139, lon: 6.5570,
    cities: [
      { name: "Minna", lat: 9.6139, lon: 6.5570, areas: ["Maikunkele", "Kpakungu", "Tunga", "Bosso"] },
      { name: "Suleja", lat: 9.1789, lon: 7.1793, areas: ["Suleja Town"] },
    ]
  },
  {
    name: "Ondo", code: "ON", capital: "Akure", lat: 7.2500, lon: 5.1950,
    cities: [
      { name: "Akure", lat: 7.2500, lon: 5.1950, areas: ["GRA", "Oke Aro", "Ijapo", "Shagari Village"] },
      { name: "Ondo", lat: 7.0887, lon: 4.8380, areas: ["Ondo Town"] },
    ]
  },
  {
    name: "Osun", code: "OS", capital: "Osogbo", lat: 7.7719, lon: 4.5624,
    cities: [
      { name: "Osogbo", lat: 7.7719, lon: 4.5624, areas: ["Station Road", "Old Garage", "GRA", "Oke Baale"] },
      { name: "Ile Ife", lat: 7.4876, lon: 4.5624, areas: ["OAU", "Enuwa", "Atewogbade"] },
    ]
  },
  {
    name: "Plateau", code: "PL", capital: "Jos", lat: 9.8965, lon: 8.8583,
    cities: [
      { name: "Jos", lat: 9.8965, lon: 8.8583, areas: ["GRA", "Rayfield", "Angwan Rogo", "Bauchi Road"] },
      { name: "Bukuru", lat: 9.7941, lon: 8.8644, areas: ["Bukuru Town"] },
    ]
  },
  {
    name: "Sokoto", code: "SO", capital: "Sokoto", lat: 13.0059, lon: 5.2476,
    cities: [
      { name: "Sokoto", lat: 13.0059, lon: 5.2476, areas: ["Mabera", "Gawon Nama", "Runjin Sambo", "GRA"] },
    ]
  },
  {
    name: "Taraba", code: "TA", capital: "Jalingo", lat: 8.8780, lon: 11.3734,
    cities: [
      { name: "Jalingo", lat: 8.8780, lon: 11.3734, areas: ["Jalingo Town", "GRA", "Magami"] },
    ]
  },
  {
    name: "Yobe", code: "YO", capital: "Damaturu", lat: 11.7463, lon: 11.9608,
    cities: [
      { name: "Damaturu", lat: 11.7463, lon: 11.9608, areas: ["Customs Road", "Maiduguri Road", "GRA"] },
    ]
  },
  {
    name: "Zamfara", code: "ZA", capital: "Gusau", lat: 12.1701, lon: 6.6861,
    cities: [
      { name: "Gusau", lat: 12.1701, lon: 6.6861, areas: ["Mada Yamma", "Hayin Dogo", "GRA"] },
    ]
  },
];
