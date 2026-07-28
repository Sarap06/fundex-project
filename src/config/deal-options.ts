// Option lists for the Create/Edit Deal wizard (Basic Info step).
// Single source of truth so the dropdowns stay consistent.

export const PROPERTY_TYPES = [
  'Single-Family Residential',
  'Multi-Family Residential',
  'Condominium',
  'Townhouse',
  'Commercial',
  'Retail',
  'Office',
  'Industrial',
  'Mixed-Use',
  'Land / Lot',
  'Hospitality',
] as const;

export const LOAN_PURPOSES = [
  'Acquisition',
  'Refinance',
  'Cash-Out Refinance',
  'Construction',
  'Renovation / Rehab',
  'Bridge',
  'Development',
  'Working Capital',
] as const;

// Sentinel option for a city not in the curated list — reveals a text input.
export const CITY_OTHER = 'Other';

// Major cities keyed by USPS state code. City dropdown loads the list for the
// selected state; anything not listed can be entered via the "Other" option.
export const CITIES_BY_STATE: Record<string, string[]> = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale', 'Chandler', 'Gilbert', 'Tempe', 'Glendale'],
  AR: ['Little Rock', 'Fayetteville', 'Fort Smith', 'Springdale'],
  CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Irvine', 'Riverside'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder'],
  CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Norwalk'],
  DE: ['Wilmington', 'Dover', 'Newark'],
  DC: ['Washington'],
  FL: ['Miami', 'Miami Beach', 'Fort Lauderdale', 'West Palm Beach', 'Boca Raton', 'Hollywood', 'Pompano Beach', 'Coral Gables', 'Doral', 'Hialeah', 'Aventura', 'Orlando', 'Tampa', 'St. Petersburg', 'Jacksonville', 'Naples', 'Fort Myers', 'Sarasota', 'Tallahassee'],
  GA: ['Atlanta', 'Augusta', 'Savannah', 'Columbus', 'Athens', 'Marietta'],
  HI: ['Honolulu', 'Hilo', 'Kailua'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Springfield', 'Rockford', 'Joliet'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Iowa City'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka'],
  KY: ['Louisville', 'Lexington', 'Bowling Green'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
  ME: ['Portland', 'Lewiston', 'Bangor'],
  MD: ['Baltimore', 'Columbia', 'Silver Spring', 'Rockville', 'Bethesda', 'Annapolis'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Newton'],
  MI: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Sterling Heights'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Bloomington', 'Duluth'],
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Biloxi'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia'],
  MT: ['Billings', 'Missoula', 'Bozeman', 'Helena'],
  NE: ['Omaha', 'Lincoln', 'Bellevue'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Summerlin'],
  NH: ['Manchester', 'Nashua', 'Concord'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Trenton', 'Hoboken'],
  NM: ['Albuquerque', 'Las Cruces', 'Santa Fe', 'Rio Rancho'],
  NY: ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'Long Island City'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Cary'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Edmond'],
  OR: ['Portland', 'Salem', 'Eugene', 'Bend', 'Beaverton'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Harrisburg', 'Scranton'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Newport'],
  SC: ['Charleston', 'Columbia', 'Greenville', 'Myrtle Beach', 'Mount Pleasant'],
  SD: ['Sioux Falls', 'Rapid City'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Franklin'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Plano', 'Frisco', 'McKinney'],
  UT: ['Salt Lake City', 'Provo', 'Ogden', 'St. George', 'Park City'],
  VT: ['Burlington', 'Montpelier'],
  VA: ['Virginia Beach', 'Richmond', 'Arlington', 'Norfolk', 'Alexandria', 'Chesapeake'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue', 'Vancouver', 'Kirkland'],
  WV: ['Charleston', 'Huntington', 'Morgantown'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
  WY: ['Cheyenne', 'Casper', 'Jackson'],
};

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type LoanPurpose = (typeof LOAN_PURPOSES)[number];
