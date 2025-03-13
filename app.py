from flask import Flask, render_template, request, jsonify

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

@app.route('/')
def index():
    return render_template('index.html', posisi=posisi, jalur=jalur)

@app.route('/move', methods=['POST'])
def move():
    global pencuri_pos, polisi_pos, game_over
    
    if game_over:
        return jsonify({"status": "game_over"})
    
    clicked_node = request.json['node']
    
    # Cek apakah langkah valid
    if clicked_node in jalur[pencuri_pos]:
        pencuri_pos = clicked_node
        
        # Polisi mengejar
        next_move = bfs(polisi_pos, pencuri_pos)
        if next_move:
            polisi_pos = next_move
        
        # Cek kondisi menang/kalah
        if pencuri_pos == "HOME":
            game_over = True
            return jsonify({
                "pencuri_pos": pencuri_pos,
                "polisi_pos": polisi_pos,
                "message": "Pencuri Menang! 🎉",
                "game_over": True
            })
        elif pencuri_pos == polisi_pos:
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