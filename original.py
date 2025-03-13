import pygame
import collections

# Inisialisasi Pygame
pygame.init()

# Ukuran layar
WIDTH, HEIGHT = 600, 650
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Pengejaran Pencuri")

# Warna
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)   # Pencuri
BLUE = (0, 0, 255)  # Polisi
GREEN = (0, 255, 0) # Rumah

# Font
font = pygame.font.SysFont(None, 40)

# Graf jalur pencuri & polisi
jalur = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "F"],
    "D": ["B", "G"],
    "E": ["B", "F", "H"],
    "F": ["C", "E", "I"],
    "G": ["D"],
    "H": ["E", "I", "J"],
    "I": ["F", "H", "K"],
    "J": ["H", "L"],
    "K": ["I", "L"],
    "L": ["J", "K", "HOME"],
    "HOME": ["L"]
}

# Posisi node di layar
posisi = {
    "A": (300, 100), "B": (200, 200), "C": (400, 200),
    "D": (150, 300), "E": (250, 300), "F": (400, 300),
    "G": (100, 400), "H": (300, 400), "I": (450, 400),
    "J": (250, 500), "K": (400, 500),
    "L": (325, 550), "HOME": (325, 600)
}

# Fungsi mencari jalur terpendek (BFS)
def bfs(start, goal):
    queue = collections.deque([[start]])
    visited = set()
    
    while queue:
        path = queue.popleft()
        node = path[-1]

        if node == goal:
            return path[1]  # Langkah pertama setelah polisi

        if node not in visited:
            visited.add(node)
            for neighbor in jalur.get(node, []):
                new_path = list(path)
                new_path.append(neighbor)
                queue.append(new_path)
    
    return None  # Jika tidak ada jalur

# Fungsi menggambar labirin
def draw_labirin():
    screen.fill(WHITE)
    
    # Gambar garis jalur
    for node, neighbors in jalur.items():
        for neighbor in neighbors:
            pygame.draw.line(screen, BLACK, posisi[node], posisi[neighbor], 2)
    
    # Gambar node dan label
    for node, (x, y) in posisi.items():
        pygame.draw.circle(screen, BLACK, (x, y), 15)
        text = font.render(node, True, BLACK)
        screen.blit(text, (x - 10, y - 25))
    
    pygame.draw.circle(screen, GREEN, posisi["HOME"], 20)  # Rumah tujuan

# Fungsi menggambar karakter
def draw_pencuri(pos):
    pygame.draw.circle(screen, RED, posisi[pos], 20)

def draw_polisi(pos):
    pygame.draw.circle(screen, BLUE, posisi[pos], 20)

# Fungsi menangani klik pada node
def get_clicked_node(x, y):
    for node, (nx, ny) in posisi.items():
        if (x - nx) ** 2 + (y - ny) ** 2 <= 15 ** 2:  # Cek dalam lingkaran
            return node
    return None

# Fungsi menampilkan pesan menang/kalah
def show_message(message):
    text = font.render(message, True, BLACK)
    screen.blit(text, (WIDTH // 2 - 100, HEIGHT // 2 - 50))
    restart_button = font.render("Ulang Lagi", True, BLACK)
    pygame.draw.rect(screen, GREEN, (WIDTH // 2 - 60, HEIGHT // 2, 120, 40))
    screen.blit(restart_button, (WIDTH // 2 - 50, HEIGHT // 2 + 5))
    pygame.display.flip()
    return True

# Fungsi untuk restart permainan
def restart_game():
    global pencuri_pos, polisi_pos, game_over
    pencuri_pos = "A"
    polisi_pos = "HOME"
    game_over = False

# Loop permainan
pencuri_pos = "A"
polisi_pos = "HOME"
game_over = False

running = True
while running:
    screen.fill(WHITE)
    draw_labirin()
    draw_pencuri(pencuri_pos)
    draw_polisi(polisi_pos)
    
    if pencuri_pos == "HOME":
        game_over = show_message("Pencuri Menang!")
    elif pencuri_pos == polisi_pos:
        game_over = show_message("Polisi Menang!")
    
    pygame.display.flip()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        elif event.type == pygame.MOUSEBUTTONDOWN and game_over:
            mx, my = pygame.mouse.get_pos()
            if WIDTH // 2 - 60 <= mx <= WIDTH // 2 + 60 and HEIGHT // 2 <= my <= HEIGHT // 2 + 40:
                restart_game()
        
        elif event.type == pygame.MOUSEBUTTONDOWN and not game_over:
            mx, my = pygame.mouse.get_pos()
            clicked_node = get_clicked_node(mx, my)
            
            if clicked_node and clicked_node in jalur[pencuri_pos]:
                pencuri_pos = clicked_node  # Pindah pencuri
                
                # Polisi mengejar pencuri
                next_move = bfs(polisi_pos, pencuri_pos)
                if next_move:
                    polisi_pos = next_move

pygame.quit()
