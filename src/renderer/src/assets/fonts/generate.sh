#!/bin/bash

# Output file
output_file="fonts.css"

# Clear the file if it exists
> "$output_file"

# Loop through each .woff file starting with Web437_ in the current directory
for font_file in Web437_*.woff; do
  # Strip off 'Web437_' prefix and file extension, replace underscores with spaces
  font_name=$(basename "$font_file" .woff | sed 's/Web437_//;s/_/ /g')
  
  # Write the @font-face CSS block to the output file
  cat <<EOL >> "$output_file"
@font-face {
  font-family: "$font_name";
  src: url("../fonts/$font_file") format("woff");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

EOL

done

echo "fonts.css generated successfully!"
