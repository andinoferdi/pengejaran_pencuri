from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

# Graf jalur
jalur = {
    "A": ["B", "C"], "B": ["A", "D", "E"], "C": ["A", "F"],
    "D": ["B", "G"], "E": ["B", "F", "H"], "F": ["C", "E", "I"],
    "G": ["D"], "H": ["E", "I", "J"], "I": ["F", "H", "K"],
    "J": ["H", "L"], "K": ["I", "L"], "L": ["J", "K", "HOME"],
    "HOME": ["L"]
}

# Posisi node (untuk dikirim ke client)
posisi = {
    "A": [300, 100], "B": [200, 200], "C": [400, 200],
    "D": [150, 300], "E": [250, 300], "F": [400, 300],
    "G": [100, 400], "H": [300, 400], "I": [450, 400],
    "J": [250, 500], "K": [400, 500], "L": [325, 550],
    "HOME": [325, 600]
}

# State permainan
pencuri_pos = "A"
polisi_pos = "HOME"
game_over = False

# BFS untuk jalur terpendek
def bfs(start, goal):
    from collections import deque
    queue = deque([[start]])
    visited = set()
    
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == goal:
            return path[1] if len(path) > 1 else None
        if node not in visited:
            visited.add(node)
            for neighbor in jalur.get(node, []):
                queue.append(path + [neighbor])
    return None

# Fungsi untuk menentukan langkah pencuri
def get_pencuri_move():
    # Cari jalur terpendek ke HOME
    path_to_home = bfs_full_path(pencuri_pos, "HOME")
    
    # Jika ada jalur ke HOME, ambil langkah berikutnya
    if path_to_home and len(path_to_home) > 1:
        return path_to_home[1]
    
    # Jika tidak ada jalur, pilih langkah acak
    possible_moves = jalur.get(pencuri_pos, [])
    if possible_moves:
        return random.choice(possible_moves)
    
    return None

# BFS untuk mendapatkan jalur lengkap
def bfs_full_path(start, goal):
    from collections import deque
    queue = deque([[start]])
    visited = set()
    
    while queue:
        path = queue.popleft()
        node = path[-1]
        if node == goal:
            return path
        if node not in visited:
            visited.add(node)
            for neighbor in jalur.get(node, []):
                new_path = list(path)
                new_path.append(neighbor)
                queue.append(new_path)
    return None

@app.route('/')
def index():
    return render_template('index.html', posisi=posisi, jalur=jalur)

@app.route('/move', methods=['POST'])
def move():
    global pencuri_pos, polisi_pos, game_over
    
    if game_over:
        return jsonify({"status": "game_over"})
    
    # Polisi bergerak berdasarkan input pemain
    clicked_node = request.json['node']
    
    # Cek apakah langkah polisi valid
    if clicked_node in jalur[polisi_pos]:
        polisi_pos = clicked_node
        
        # Cek apakah polisi menangkap pencuri
        if polisi_pos == pencuri_pos:
            game_over = True
            return jsonify({
                "pencuri_pos": pencuri_pos,
                "polisi_pos": polisi_pos,
                "message": "Polisi Menang! 🚨",
                "game_over": True
            })
        
        # Pencuri bergerak otomatis
        next_pencuri_move = get_pencuri_move()
        if next_pencuri_move:
            pencuri_pos = next_pencuri_move
            
            # Cek apakah pencuri mencapai HOME
            if pencuri_pos == "HOME":
                game_over = True
                return jsonify({
                    "pencuri_pos": pencuri_pos,
                    "polisi_pos": polisi_pos,
                    "message": "Pencuri Menang! 🎉",
                    "game_over": True
                })
            
            # Cek apakah polisi menangkap pencuri setelah pencuri bergerak
            if polisi_pos == pencuri_pos:
                game_over = True
                return jsonify({
                    "pencuri_pos": pencuri_pos,
                    "polisi_pos": polisi_pos,
                    "message": "Polisi Menang! 🚨",
                    "game_over": True
                })
        
        return jsonify({
            "pencuri_pos": pencuri_pos,
            "polisi_pos": polisi_pos,
            "game_over": False
        })
    
    return jsonify({"status": "invalid_move"})

@app.route('/restart', methods=['POST'])
def restart():
    global pencuri_pos, polisi_pos, game_over
    pencuri_pos = "A"
    polisi_pos = "HOME"
    game_over = False
    return jsonify({
        "pencuri_pos": pencuri_pos,
        "polisi_pos": polisi_pos,
        "game_over": False
    })

if __name__ == '__main__':
    app.run(debug=True)