#!/bin/bash

# Output file
output_file="fontNames.js"

# Start the array in the output file
echo "export const fontNames = [" > "$output_file"

# Loop through each .woff file starting with Web437_ in the current directory
for font_file in Web437_*.woff; do
  # Strip off 'Web437_' prefix and file extension, replace underscores with spaces
  font_name=$(basename "$font_file" .woff | sed 's/Web437_//;s/_/ /g')

  # Append the font name as a string to the array in the output file
  echo "  \"$font_name\"," >> "$output_file"
done

# End the array
echo "];" >> "$output_file"

echo "fontNames.js generated successfully!"