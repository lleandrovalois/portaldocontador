# Imagem base oficial ultra leve do Nginx Alpine
FROM nginx:alpine

# Remove a configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia nossa configuração otimizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos do Portal do Contador para o diretório raiz do Nginx
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY vendor/ /usr/share/nginx/html/vendor/
COPY assets/ /usr/share/nginx/html/assets/

# Expõe a porta 80 do container
EXPOSE 80

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
