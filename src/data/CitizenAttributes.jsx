export const hairTypeLabels = {
  0: "A bald head",
  1: "Short",
  2: "Long",
};

export const hairColourLabels = {
  0: "Black",
  1: "Brown",
  2: "Blonde",
  3: "Ginger",
  4: "Red",
  5: "Blue",
  6: "Green",
  7: "Purple",
  8: "Pink",
  9: "Grey",
  10: "White",
};

export const eyeColourLabels = {
  0: "Blue",
  1: "Brown",
  2: "Green",
  3: "Grey",
};

export const facialFeatureLabels = {
  0: "Scarring",
  1: "Beard",
  2: "Moustache",
  3: "Piercing",
  4: "Tattoo",
  5: "Glasses",
  6: "Mole",
};

export const bloodTypeLabels = {
  1: "A+",
  2: "A-",
  3: "B+",
  4: "B-",
  5: "O+",
  6: "O-",
  7: "AB+",
  8: "AB-",
};

export const heightLabels = {
  0: "Very short",
  1: "Short",
  2: "Average",
  3: "Tall",
  4: "Very tall",
};

export const genderLabels = {
  0: "Male",
  1: "Female",
  2: "Non-binary",
};

// For filter dropdowns in search overlay.
export const filterSchema = {
  hairColour: Object.values(hairColourLabels),
  hairType: Object.values(hairTypeLabels),
  height: Object.values(heightLabels),
  gender: Object.values(genderLabels),
  blood: Object.values(bloodTypeLabels),
  eyeColour: Object.values(eyeColourLabels),
  facialFeature: Object.values(facialFeatureLabels),
  shoeSize: ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
  jobTitle: [] // Will be populated dynamically from city data
};