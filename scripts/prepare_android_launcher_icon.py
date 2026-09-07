from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/home/ubuntu/webdev-static-assets/hortimax-favicon-original.png")
RES = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"

# Tamaños estándar de launcher para Android. El foreground adaptativo usa
# 2,25× el lienzo legacy para conservar la zona segura al aplicarse la máscara.
DENSITIES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}


def write_icon(image: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize((size, size), Image.Resampling.LANCZOS).save(path, "PNG")


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"No se encontró el favicon original: {SOURCE}")

    # Se conserva todo el lienzo cuadrado del favicon; no hay recorte ni redibujo.
    favicon = Image.open(SOURCE).convert("RGBA")

    for density, size in DENSITIES.items():
        folder = RES / f"mipmap-{density}"
        write_icon(favicon, folder / "ic_launcher.png", size)
        write_icon(favicon, folder / "ic_launcher_round.png", size)
        write_icon(favicon, folder / "ic_launcher_foreground.png", int(size * 2.25))

    print(f"Ícono Android actualizado desde el favicon HORTIMAX: {SOURCE}")


if __name__ == "__main__":
    main()
